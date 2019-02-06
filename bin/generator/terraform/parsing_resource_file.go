package terraform

import (
	"io/ioutil"
	"regexp"
	"strings"

	"github.com/Jeffail/gabs"
)

type ElementProcess struct {
	endIndex int
	curentIndex int
	in string
	index int
	newValue string
	val bool
}

type ElementProcessCC struct {
	element byte
	endIndex int
	curentIndex int
	in string
	index int
	index2 int
	val bool
}

var argsToRemove = []string{
	"(", "ValidateFunc:", "ConflictsWith:", "func(diff", "customdiff.",
	"CustomizeDiff:", "StateFunc:", "DiffSuppressFunc:", "Default:",
	"Create:", "Importer:", "Read:", "Update:", "Delete:", "accepter:",
	"Timeouts:", "Deprecated:",
}

var argsToReplaceVariableName = map[string]string{
	"schema.TypeString": "string", "schema.TypeFloat": "float",
	"schema.TypeFloat64": "float", "schema.TypeList": "list",
	"schema.TypeMap": "map", "schema.TypeBool": "bool",
	"schema.TypeSet": "set", "schema.TypeInt": "int",
	"schema.HashString": "string", "{Type:": "{\"Type\":",
	"Optional:": ",\"Optional\":", "ForceNew:": ",\"ForceNew\":",
	"Computed:": ",\"Computed\":", "Required:": ",\"Required\":",
	"MaxItems:": ",\"MaxItems\":", "Sensitive:": ",\"Sensitive\":",
	"Set:": ",\"Set\":", "SchemaVersion:": ",\"SchemaVersion\":",
	"Description:": ",\"Description\":", "Elem:": ",\"Elem\":",
	"Removed:": ",\"Removed\":", "Type:": ",\"Type\":", "MinItems:": ",\"MinItems\":",
}

var argsToReplaceText = map[string]string{
	"false)": "", "true)": "", "(": "",
	")": "", ",}": "}", "}\"": "},\"",
	"{,": "{", ",,": ",", "/": "", "return": "",
	"}\"}": "}}", ",\"}": "}", "{{": "{",
}

// ParsingFile - Parsing resource file
func ParsingFile(root string, fileName string, provider string) (bool, string, bool) {
	data, _ := ioutil.ReadFile(root + fileName)
	input := string(data)
	existID := false
	if strings.Index(input, "d.SetId") > -1 {
		existID = true
	}
	re0 := regexp.MustCompile(`(?m)\/\/ .+?\n`)
	for _, match0 := range re0.FindAllString(input, -1) {
		input = strings.Replace(input, match0, "", -1)
	}
	re0 = regexp.MustCompile(`(?m)\/\/[^"]+?\n`)
	for _, match0 := range re0.FindAllString(input, -1) {
		input = strings.Replace(input, match0, "", -1)
	}
	input = strings.Replace(input, "\n", "", -1)
	input = strings.Replace(input, "\r", "", -1)
	input = strings.Replace(input, "\t", "", -1)
	input = strings.Replace(input, " ", "", -1)
	re0 = regexp.MustCompile(`(?m)/\*.+?\*/`)
	for _, match0 := range re0.FindAllString(input, -1) {
		input = strings.Replace(input, match0, "", -1)
	}
	re0 = regexp.MustCompile(`(?m)\*schema.Resource{.+?}func`)
	for _, match0 := range re0.FindAllString(input, -1) {
		input = match0
	}
	re0 = regexp.MustCompile(`(?m)\*schema.Resource{.+?}const`)
	for _, match0 := range re0.FindAllString(input, -1) {
		input = strings.Replace(match0, "const", "func", -1)
	}
	re := regexp.MustCompile(`(?m)Schema:.+?}func`)
	for _, match := range re.FindAllString(input, -1) {
		return ParsingFileProcessing(match, existID)
	}
	return true, "Error: " + fileName, false
}

// ParsingFileProcessing - Parsing resource file
func ParsingFileProcessing(match string, existID bool) (bool, string, bool) {
	match = strings.Replace(match, "Schema:map[string]*schema.Schema", "", -1)
	match = strings.Replace(match, "Schema:map[string]", "", -1)
	match = strings.Replace(match, "&schema.Resource", "", -1)
	match = strings.Replace(match, "&schema.Schema", "", -1)
	match = strings.Replace(match, "*schema.Schema", "", -1)
	for _, element := range argsToRemove {
		match = ResolveJSONElem(match, element)
	}
	match = ResolveJSONElemChange(match, "Elem:")
	match = strings.Replace(match, "}func", "", 1)
	re2 := regexp.MustCompile(`(?m)//https.+?html"`)
	for _, match2 := range re2.FindAllString(match, -1) {
		match = strings.Replace(match, match2, "\"", -1)
	}
	match = ResolveRepeatedElements(match, ",}", "}")
	match = ResolveRepeatedElements(match, "{,", "{")
	match = strings.Replace(match, "tagsSchemaComputed", "{\"Type\":\"map\",\"Optional\":\"true\"}", -1)
	match = strings.Replace(match, "autoscalingTagSchema", "{\"Type\":\"list\",\"Optional\":\"true\"}", -1)
	match = strings.Replace(match, "tagsSchema", "{\"Type\":\"map\",\"Optional\":\"true\"}", -1)
	re2 = regexp.MustCompile(`(?m)\:[^\{+^\"]+?[\}|\,]`)
	for _, match2 := range re2.FindAllString(match, -1) {
		lastElement := match2[len(match2)-1 : len(match2)]
		newValue := match2[1 : len(match2)-1]
		match = strings.Replace(match, match2, ":\""+newValue+"\""+lastElement, -1)
	}
	for key, value := range argsToReplaceVariableName {
		match = strings.Replace(match, key, value, -1)
	}
	re2 = regexp.MustCompile(`(?m)_:=.+?}`)
	for _, match2 := range re2.FindAllString(match, -1) {
		match = strings.Replace(match, match2, "}", -1)
	}
	re2 = regexp.MustCompile(`(?m)"".+?\}`)
	for _, match2 := range re2.FindAllString(match, -1) {
		match = strings.Replace(match, match2, "\"}", -1)
	}
	for key, value := range argsToReplaceText {
		match = ResolveRepeatedElements(match, key, value)
	}
	match = ResolveRepeatedElements(match, ",,", ",")
	match = ResolveJSON(match)
	match = ResolveRepeatedElements(match, "{,", "{")
	match = ResolveRepeatedElements(match, ",,", ",")
	match = ResolveRepeatedElements(match, " ", "")
	match = strings.Replace(match, ",Schema:", ",\"Schema\":", -1)
	match = strings.Replace(match, "Schema:", "\"Schema\":", -1)
	_, err := gabs.ParseJSON([]byte(match))
	if err != nil {
		return true, err.Error(), false
	} else {
		return false, match, existID
	}
}

// ResolveRepeatedElements - Replasing all elements in the circle
func ResolveRepeatedElements(in string, element string, replaceElement string) string {
	startPosition := strings.Index(in, element)
	for startPosition > -1 {
		in = strings.Replace(in, element, replaceElement, -1)
		startPosition = strings.Index(in, element)
	}
	return in
}

// ResolveJSONElemChange - Resolve all elements `Elem`
func ResolveJSONElemChange(in string, element string) string {
	startIndex := strings.Index(in, element)
	for startIndex > -1 {
		endIndex, newValue := ResolveJSONElemChangeProcessing(in, element, startIndex)
		out := in[startIndex : endIndex+1]
		newValue = ResolveJSONElemP(newValue)
		newValue = ResolveRepeatedElements(newValue, ",}", "}")
		in = strings.Replace(in, out, newValue, -1)
		startIndex = strings.Index(in, element)
	}
	return in
}

// ResolveJSONElemChangeProcessing - Resolve all elements `Elem`
func ResolveJSONElemChangeProcessing(in string, element string, startIndex int) (int, string) {
	newValue := "\"" + strings.Replace(element, ":", "", -1) + "\":"
	index := 0
	endIndex := len(in)
	val := false
	for i := startIndex + 5; i < len(in); i++ {
		element := in[i]
		if element == '{' {
			index++
			val = true
		}
		if element == '}' {
			index--
		}
		endIndex, i, index, newValue, val = ResolveJSONElemChangeProcessingInter(ElementProcess{
			endIndex, i, in, index, newValue, val})
	}
	return endIndex, newValue
}

// ResolveJSONElemChangeProcessingInter - Resolve all elements `Elem`
func ResolveJSONElemChangeProcessingInter(param ElementProcess) (int, int, int, string, bool) {
	element := param.in[param.curentIndex]
	if param.in[param.endIndex-1] == '{' && param.in[param.endIndex] == '}' {
		param.val = false
	}
	param.newValue += string(element)
	param.endIndex = param.curentIndex
	if (param.index == 0 && param.val) || (element == ',' && !param.val) {
		param.curentIndex = len(param.in) + 1
	}
	if (param.index < 0 && !param.val) || (element == ',' && !param.val) {
		param.curentIndex = len(param.in) + 1
	}
	return param.endIndex, param.curentIndex, param.index, param.newValue, param.val
}

// ResolveJSONElemP - Resolve parity of acolytes
func ResolveJSONElemP(in string) string {
	startIndex := strings.Index(in, "{{")
	for startIndex > -1 {
		endIndex, newValue := ResolveJSONElemPProcessing(in, startIndex)
		out := in[:endIndex]
		in = strings.Replace(in, out, newValue, -1)
		startIndex = strings.Index(in, "{{")
	}
	return in
}

// ResolveJSONElemPProcessing - Resolve parity of acolytes
func ResolveJSONElemPProcessing(in string, startIndex int) (int, string) {
	newValue := in[:startIndex]
	index := 1
	endIndex := len(in)
	for i := startIndex; i < len(in) && index != 0; i++ {
		element := in[i]
		con1 := element != in[i-1] && element == '{'
		index, newValue = ForCodeClimate0(con1, element, index, newValue)
		con2 := element == in[i-1] && element != '{'
		if con2 || element != '{' {
			newValue += string(element)
		}
		endIndex = i
	}
	return endIndex, newValue
}

// ForCodeClimate0 - special pentru CodeClimate :)
func ForCodeClimate0(con1 bool, element byte, index int, newValue string) (int, string) {
	if con1 {
		index++
		newValue += string(element)
	}
	if element == '}' {
		index--
	}
	return index, newValue
}

// ResolveJSONElem - Remove elements
func ResolveJSONElem(in string, element string) string {
	startIndex := strings.Index(in, element)
	for startIndex > -1 {
		endIndex := ResolveJSONElemProcessing(in, element, startIndex)
		out := in[startIndex : endIndex+1]
		in = strings.Replace(in, out, "", -1)
		in = ResolveRepeatedElements(in, ",,", ",")
		startIndex = strings.Index(in, element)
	}
	return in
}

// ResolveJSONElemProcessing - Remove elements
func ResolveJSONElemProcessing(in string, element string, startIndex int) int {
	index := 0
	index2 := 0
	endIndex := len(in)
	val := false
	for i := startIndex; i < len(in); i++ {
		element := in[i]
		endIndex, i, index, index2, val = ForCodeClimate(ElementProcessCC{
			element, endIndex, i, in, index, index2, val})
		if index < 0 && !val && index2 == 0 {
			endIndex--
			i = len(in) + 1
		}
	}
	return endIndex
}


// ForCodeClimate - Special pentru CodeClimate :)
func ForCodeClimate(param ElementProcessCC) (int, int, int, int, bool) {
	switch param.element {
	case '{':
		param.index++
		param.val = true
	case '}':
		param.index--
	case '(':
		param.index2++
		param.val = true
	case ')':
		param.index2--
	}
	if param.in[param.endIndex-1] == '{' && param.in[param.endIndex] == '}' {
		param.val = false
	}
	param.endIndex = param.curentIndex
	if param.index == 0 && param.val && param.index2 == 0 {
		param.curentIndex = len(param.in) + 1
	}
	return param.endIndex, param.curentIndex, param.index, param.index2, param.val
}

// ResolveJSON - Resolve parity of acolytes
func ResolveJSON(in string) string {
	outFinal := "{"
	i := 0
	start := 1
	if in[0] != '{' {
		start = 0
	}
	for _, element := range in[start : len(in)-1] {
		i, outFinal = ResolveJSONProcessing(element, i, outFinal)
	}
	return outFinal + "}"
}

// ResolveJSONProcessing - Resolve parity of acolytes
func ResolveJSONProcessing(element rune, i int, outFinal string) (int, string) {
	if element == '{' && i == -1 {
		i = 1
	} else if element == '{' {
		i++
	}
	if element == '{' {
		outFinal += string(element)
	}
	if element == '}' && i > -1 {
		i--
	}
	if element == '}' && i > -1 {
		outFinal += string(element)
	}
	if element != '{' && element != '}' {
		outFinal += string(element)
	}
	return i, outFinal
}
