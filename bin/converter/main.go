package main

import (
	b64 "encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/hashicorp/hcl/hcl/printer"
	"github.com/hashicorp/hcl2/hcl"
	"github.com/hashicorp/hcl2/hcl/hclsyntax"
	"github.com/hashicorp/hcl2/hclwrite"
	"github.com/zclconf/go-cty/cty"
	ctyconvert "github.com/zclconf/go-cty/cty/convert"
	ctyjson "github.com/zclconf/go-cty/cty/json"
)

type Map map[string]json.RawMessage
type Array []json.RawMessage

var (
	input             = ""
	version           = false
	versionInfo       = "development"
	tf12format        = "yes"
	filetype          = "tf"
	file              = false
	interpolation     = ""
	interpolationList = []string{
		"provider", "schema",
	}
	functionList = []string{
		"path", "local", "var", "module", "data", "string", "aws",
		"abs", "ceil", "floor", "log", "max", "min", "pow", "signum", "chomp",
		"format", "formatlist", "indent", "join", "lower", "replace", "split",
		"strrev", "substr", "title", "trimspace", "upper", "chunklist",
		"coalesce", "coalescelist", "compact", "concat", "contains",
		"distinct", "element", "flatten", "index", "keys", "length", "list",
		"lookup", "map", "matchkeys", "merge", "range", "reverse",
		"setintersection", "setproduct", "setunion", "slice", "sort",
		"transpose", "values", "zipmap", "base64decode", "base64encode",
		"base64gzip", "csvdecode", "jsondecode", "jsonencode", "urlencode",
		"yamldecode", "yamlencode", "abspath", "dirname", "pathexpand",
		"basename", "file", "fileexists", "filebase64", "templatefile",
		"formatdate", "timeadd", "timestamp", "base64sha256", "base64sha512",
		"bcrypt", "filebase64sha256", "filebase64sha512", "filemd5",
		"filesha1", "filesha256", "filesha512", "md5", "rsadecrypt", "sha1",
		"sha256", "sha512", "uuid", "uuidv5", "cidrhost", "cidrnetmask",
		"cidrsubnet", "tobool", "tolist", "tomap", "tonumber", "toset", "tostring",
	}
	resourceTypeList = []string{
		"locals", "module", "output", "variable", "resource", "data", "terraform",
		"provider", "required_providers",
	}
	functionListWithDot = []string{
		"aws", "data",
	}
	resourceDoNotPrint = []string{
		"locals", "terraform", "data", "resource", "required_providers",
	}
	doubleScope = []string{
		"provider", "variable",
	}
	withoutStartMap = []string{
		"provisioner", "local-exec",
		"remote-exec", "chef", "file", "habitat", "puppet", "scope",
	}
	withoutEqual = []string{
		"assume_role", "scope",
	}
)

func init() {
	flag.BoolVar(&version, "v", false, "Prints current app version")
	flag.StringVar(&input, "i", "", "Input string that contains the JSON configuration to convert.")
	flag.StringVar(&tf12format, "F", "", "Use Terraform 0.12 formatter. Default value is 'yes'.")
	flag.StringVar(&filetype, "T", "", "Input file type format. Default value is 'tf'.")
	flag.BoolVar(&file, "f", false, "Convert HCL file to JSON.")

	flag.Parse()
}

func main() {
	if version {
		fmt.Println(versionInfo)
		return
	}

	data, err := b64.StdEncoding.DecodeString(input)
	if err != nil {
		fmt.Println("error:", err)
		return
	}

	if file {
		toJSON(data)
		return
	}

	input = string(data)

	if strings.Index(input, "{\\\"") > -1 {
		input = strings.Replace(input, "{\\\"", "{'", -1)
		input = strings.Replace(input, ", \\\"", ", '", -1)
		input = strings.Replace(input, "\\\": ", "': ", -1)
		input = strings.Replace(input, "\\\":", "':", -1)
	}
	var outHCL2 = []byte(walkJson([]byte(input), 0, "", "", ""))

	if tf12format == "no" {
		outHCL2, _ = printer.Format(outHCL2)
	} else {
		outHCL2 = hclwrite.Format(outHCL2)
	}
	_, _ = os.Stdout.WriteString(string(outHCL2))
}

func Contains(a []string, x string) bool {
	for _, n := range a {
		if x == n {
			return true
		}
	}

	return false
}

func ContainsOneOfElement(x string, a []string) bool {
	for _, n := range a {
		for index := 0; index < len(x); index++ {
			if string(x[index]) == n {
				return true
			}
		}
	}

	return false
}

func walkJson(raw json.RawMessage, level int, outHCL2 string, resourceType string, lastIndex string) string {
	if raw[0] == 123 && raw[0] == 125 { //  123 is `{` => object
		outHCL2 += " {}\n"
	} else if raw[0] == 123 { //  123 is `{` => object
		var cont Map
		_ = json.Unmarshal(raw, &cont)
		for i, v := range cont {
			if i == "backend" && level == 0 && resourceType == "required_providers" {
				resourceType = lastIndex
				level = 1
			}
			if Contains(resourceTypeList, i) && ((Contains(doubleScope, i) && (v[0] == 91 || v[0] == 123)) || !Contains(doubleScope, i)) {
				interpolation = ""
				if !Contains(interpolationList, resourceType) {
					level = 0
				}
				resourceType = i
			}

			if v[0] == 91 && Contains(interpolationList, i) {
				interpolation = i
			}

			if level == 1 && !Contains(resourceDoNotPrint, resourceType) {
				outHCL2 += resourceType + " "
			}

			switch resourceType {
			case "locals":
				outHCL2 += mapIn1Level(i, level, v)
			case "terraform":
				outHCL2 += mapIn1LevelAndSubLevel(i, level, v)
			case "module", "output", "variable", "provider":
				outHCL2 += mapIn2Level(i, level, v, lastIndex)
			case "resource", "data":
				outHCL2 += mapIn3Level(i, level, v, lastIndex, resourceType)
			default:
				outHCL2 += mapIn(i, level, v, resourceType, lastIndex)
			}

			outHCL2 += walkJson(v, level+1, "", resourceType, i)

			switch resourceType {
			case "locals":
				outHCL2 += mapOut1Level(v)
			case "terraform":
				outHCL2 += mapOut1LevelAndSubLevel(level, v)
			case "module", "output", "variable", "provider":
				outHCL2 += mapOut2Level(level, v)
			case "resource", "data":
				outHCL2 += mapOut3Level(level, v)
			default:
				outHCL2 += mapOut(v)
			}
		}
	} else if raw[0] == 91 && raw[1] == 93 { // 91 is `[`  => array
		outHCL2 += " []\n"
	} else if raw[0] == 91 { // 91 is `[`  => array
		var cont Array
		_ = json.Unmarshal(raw, &cont)
		for i, v := range cont {
			if interpolation != "" && level < 2 {
				outHCL2 += walkJson(v, 1, "", resourceType, "")
			} else if v[0] == 123 {
				isBlock := false
				if len(lastIndex) > 1 && lastIndex[len(lastIndex)-1] == '!' {
					isBlock = true
				}
				if i == 0 {
					if lastIndex != "provisioner" {
						outHCL2 += " {\n"
					}
				} else if lastIndex == "provisioner" {
					outHCL2 += lastIndex + " "
				} else if Contains(withoutEqual, lastIndex) || isBlock {
					newLastIndex := lastIndex
					if isBlock {
						newLastIndex = newLastIndex[0 : len(newLastIndex)-1]
					}
					outHCL2 += newLastIndex + " {\n"
				} else {
					outHCL2 += lastIndex + " = {\n"
				}
				outHCL2 += walkJson(v, level, "", resourceType, lastIndex)
				if lastIndex != "provisioner" {
					outHCL2 += "}\n"
				}
			} else {
				if i == 0 {
					outHCL2 += " [\n"
				}
				outHCL2 += walkJson(v, level+1, "", resourceType, "")
				if i < len(cont)-1 {
					outHCL2 = outHCL2[0:len(outHCL2)-1] + ",\n"
				} else {
					outHCL2 += "]\n"
				}
			}
		}

	} else {
		var val interface{}
		_ = json.Unmarshal(raw, &val)
		switch v := val.(type) {
		case float64:
			if tf12format == "no" {
				outHCL2 += "\"" + strconv.FormatFloat(v, 'f', -1, 64) + "\"\n"
			} else {
				outHCL2 += strconv.FormatFloat(v, 'f', -1, 64) + "\n"
			}
		case string:
			isBlock := false
			if len(v) > 1 && v[len(v)-1] == '!' {
				isBlock = true
				v = v[0 : len(v)-1]
			}
			itIsFor := false
			if (strings.Index(v, "for") > 0 || strings.Index(v, "aws") > -1) &&
				(strings.Replace(v, " ", "", -1)[0:4] == "{for" || strings.Replace(v, " ", "", -1)[0:4] == "aws_" ||
				strings.Replace(v, " ", "", -1)[0:4] == "[for") {
				itIsFor = true
			}
			if (isFunction(v, level) || itIsFor || isBlock) && tf12format != "no" {
				outHCL2 += v + "\n"
			} else {
				outHCL2 += "\"" + v + "\"\n"
			}
		case bool:
			if tf12format == "no" {
				outHCL2 += "\"" + strconv.FormatBool(v) + "\"\n"
			} else {
				outHCL2 += strconv.FormatBool(v) + "\n"
			}
		case nil:
			outHCL2 += ""
		default:
			outHCL2 += "unknown type"
		}
	}

	return outHCL2
}

func mapIn1Level(i string, level int, raw json.RawMessage) string {
	var outHCL2 = ""
	switch level {
	case 0:
		outHCL2 = i
	default:
		outHCL2 = i + " = "
	}
	if raw[0] == 123 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func checkPoint(i string) string {
	if strings.Index(i, ".") > -1 {
		return "\"" + i + "\""
	}
	return i
}

func mapIn1LevelAndSubLevel(i string, level int, raw json.RawMessage) string {
	var outHCL2 = ""
	switch level {
	case 0, 1:
		outHCL2 = i
	case 2:
		outHCL2 = "\"" + i + "\""
	default:
		outHCL2 = checkPoint(i) + " = "
	}
	if raw[0] == 123 && level != 1 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapIn2Level(i string, level int, raw json.RawMessage, lastIndex string) string {
	var outHCL2 = ""
	isBlock := false
	if len(i) > 1 && i[len(i)-1] == '!' {
		isBlock = true
		i = i[0 : len(i)-1]
	}
	switch level {
	case 0:
	case 1:
		outHCL2 = "\"" + i + "\""
	default:
		if Contains(withoutEqual, i) || isBlock {
			outHCL2 = i
		} else {
			outHCL2 = checkPoint(i) + " ="
		}
	}
	if raw[0] == 123 && level >= 1 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapIn3Level(i string, level int, raw json.RawMessage, lastIndex string, resourceType string) string {
	var outHCL2 = ""
	isBlock := false
	if len(i) > 1 && i[len(i)-1] == '!' {
		isBlock = true
		i = i[0 : len(i)-1]
	}
	switch level {
	case 0:
	case 1:
	case 2:
		outHCL2 = resourceType + " \"" + lastIndex + "\" \"" + i + "\""
	default:
		if ContainsOneOfElement(i, []string{"/", ",", "."}) || lastIndex == "provisioner" {
			if Contains(withoutStartMap, i) || isBlock {
				outHCL2 = "\"" + i + "\" "
			} else {
				outHCL2 = "\"" + i + "\" ="
			}
		} else if Contains(withoutStartMap, i) || Contains(withoutEqual, i) || isBlock {
			outHCL2 = i + " "
		} else {
			outHCL2 = checkPoint(i) + " ="
		}

	}
	if raw[0] == 123 && level >= 2 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapIn(i string, level int, raw json.RawMessage, resourceType string, lastIndex string) string {
	var outHCL2 string
	if interpolation != "" && level == 1 {
		outHCL2 = " \"" + i + "\" "
	} else if (raw[0] != 91 || level > 0 || resourceType == "") && i != "required_providers" {
		outHCL2 = checkPoint(i) + " ="
	} else if i == "required_providers" {
		outHCL2 = i + " "
	}

	if raw[0] == 123 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapOut1Level(raw json.RawMessage) string {
	var outHCL2 = ""
	if raw[len(raw)-1] == 125 {
		outHCL2 = "}\n"
	}

	return outHCL2
}

func mapOut1LevelAndSubLevel(level int, raw json.RawMessage) string {
	var outHCL2 = ""
	if raw[len(raw)-1] == 125 && level != 1 {
		outHCL2 = "}\n"
	}

	return outHCL2
}

func mapOut2Level(level int, raw json.RawMessage) string {
	var outHCL2 = ""
	switch level {
	case 0:
	case 1:
		outHCL2 = "}\n"
	default:
		if raw[len(raw)-1] == 125 {
			outHCL2 = "}\n"
		}
	}

	return outHCL2
}

func mapOut3Level(level int, raw json.RawMessage) string {
	var outHCL2 = ""
	switch level {
	case 0:
	case 1:
	case 2:
		outHCL2 = "}\n"
	default:
		if raw[len(raw)-1] == 125 {
			outHCL2 = "}\n"
		}
	}

	return outHCL2
}

func mapOut(raw json.RawMessage) string {
	var outHCL2 = ""

	if raw[len(raw)-1] == 125 {
		outHCL2 = "}\n"
	}

	return outHCL2
}

func isFunction(val string, level int) bool {
	if val == "terraform.workspace" {
		return true
	}
	for _, element := range functionList {
		if val == "local" || (filetype != "tf") {
			return false
		}
		startIndex := strings.Index(val, element)
		if startIndex == 0 {
			if Contains(functionListWithDot, element) && strings.Index(val, element+".") != 0 {
				return false
			}
			if element == "index" && strings.Index(val, "(") < 0 {
				return false
			}
			return true
		}
	}

	return false
}

func toJSON(input []byte) {
	var content interface{}
	content, _ = getPackJSON(input, "terrahub.svc")

	jb, err := json.MarshalIndent(content, "", "    ")

	if err != nil {
		fmt.Errorf("unable to parse HCL: %s", err)
	}

	os.Stdout.Write(jb)
}

func getPackJSON(bytes []byte, filename string) (interface{}, error) {
	file, diags := hclsyntax.ParseConfig(bytes, filename, hcl.Pos{Line: 1, Column: 1})
	if diags.HasErrors() {
		return nil, diags
	}
	return convertFile(file)
}

type jsonObj map[string]interface{}

// Convert an hcl File to a json serializable object
// This assumes that the body is a hclsyntax.Body
func convertFile(file *hcl.File) (jsonObj, error) {
	c := converter{bytes: file.Bytes}
	body := file.Body.(*hclsyntax.Body)
	return c.convertBody(body)
}

type converter struct {
	bytes []byte
}

func (c *converter) rangeSource(r hcl.Range) string {
	return string(c.bytes[r.Start.Byte:r.End.Byte])
}

func (c *converter) convertBody(body *hclsyntax.Body) (jsonObj, error) {
	var err error
	out := make(jsonObj)
	for key, value := range body.Attributes {
		out[key], err = c.convertExpression(value.Expr)
		if err != nil {
			return nil, err
		}
	}

	for _, block := range body.Blocks {
		err = c.convertBlock(block, out)
		if err != nil {
			return nil, err
		}
	}

	return out, nil
}

func (c *converter) convertBlock(block *hclsyntax.Block, out jsonObj) error {
	var key string = block.Type

	value, err := c.convertBody(block.Body)
	if err != nil {
		return err
	}

	for _, label := range block.Labels {
		if inner, exists := out[key]; exists {
			var ok bool
			out, ok = inner.(jsonObj)
			if !ok {
				// TODO: better diagnostics
				return fmt.Errorf("Unable to conver Block to JSON: %v.%v", block.Type, strings.Join(block.Labels, "."))
			}
		} else {
			obj := make(jsonObj)
			out[key] = obj
		}
		key = label
	}

	if current, exists := out[key]; exists {
		if list, ok := current.([]interface{}); ok {
			out[key] = append(list, value)
		} else {
			out[key] = []interface{}{current, value}
		}
	} else {
		out[key] = value
	}

	return nil
}

func (c *converter) convertExpression(expr hclsyntax.Expression) (interface{}, error) {
	// assume it is hcl syntax (because, um, it is)
	switch value := expr.(type) {
	case *hclsyntax.LiteralValueExpr:
		return ctyjson.SimpleJSONValue{Value: value.Val}, nil
	case *hclsyntax.TemplateExpr:
		return c.convertTemplate(value)
	case *hclsyntax.TemplateWrapExpr:
		return c.convertExpression(value.Wrapped)
	case *hclsyntax.TupleConsExpr:
		var list []interface{}
		for _, ex := range value.Exprs {
			elem, err := c.convertExpression(ex)
			if err != nil {
				return nil, err
			}
			list = append(list, elem)
		}
		return list, nil
	case *hclsyntax.ObjectConsExpr:
		m := make(jsonObj)
		for _, item := range value.Items {
			key, err := c.convertKey(item.KeyExpr)
			if err != nil {
				return nil, err
			}
			m[key], err = c.convertExpression(item.ValueExpr)
			if err != nil {
				return nil, err
			}
		}
		return m, nil
	default:
		return c.wrapExpr(expr), nil
	}
}

func (c *converter) convertTemplate(t *hclsyntax.TemplateExpr) (string, error) {
	if t.IsStringLiteral() {
		// safe because the value is just the string
		v, err := t.Value(nil)
		if err != nil {
			return "", err
		}
		return v.AsString(), nil
	}
	var builder strings.Builder
	for _, part := range t.Parts {
		s, err := c.convertStringPart(part)
		if err != nil {
			return "", err
		}
		builder.WriteString(s)
	}
	return builder.String(), nil
}

func (c *converter) convertStringPart(expr hclsyntax.Expression) (string, error) {
	switch v := expr.(type) {
	case *hclsyntax.LiteralValueExpr:
		s, err := ctyconvert.Convert(v.Val, cty.String)
		if err != nil {
			return "", err
		}
		return s.AsString(), nil
	case *hclsyntax.TemplateExpr:
		return c.convertTemplate(v)
	case *hclsyntax.TemplateWrapExpr:
		return c.convertStringPart(v.Wrapped)
	case *hclsyntax.ConditionalExpr:
		return c.convertTemplateConditional(v)
	case *hclsyntax.TemplateJoinExpr:
		return c.convertTemplateFor(v.Tuple.(*hclsyntax.ForExpr))
	default:
		// treating as an embedded expression
		return c.wrapExpr(expr), nil
	}
}

func (c *converter) convertKey(keyExpr hclsyntax.Expression) (string, error) {
	// a key should never have dynamic input
	if k, isKeyExpr := keyExpr.(*hclsyntax.ObjectConsKeyExpr); isKeyExpr {
		keyExpr = k.Wrapped
		if _, isTraversal := keyExpr.(*hclsyntax.ScopeTraversalExpr); isTraversal {
			return c.rangeSource(keyExpr.Range()), nil
		}
	}
	return c.convertStringPart(keyExpr)
}

func (c *converter) convertTemplateConditional(expr *hclsyntax.ConditionalExpr) (string, error) {
	var builder strings.Builder
	builder.WriteString("%{if ")
	builder.WriteString(c.rangeSource(expr.Condition.Range()))
	builder.WriteString("}")
	trueResult, err := c.convertStringPart(expr.TrueResult)
	if err != nil {
		return "", nil
	}
	builder.WriteString(trueResult)
	falseResult, err := c.convertStringPart(expr.FalseResult)
	if len(falseResult) > 0 {
		builder.WriteString("%{else}")
		builder.WriteString(falseResult)
	}
	builder.WriteString("%{endif}")

	return builder.String(), nil
}

func (c *converter) convertTemplateFor(expr *hclsyntax.ForExpr) (string, error) {
	var builder strings.Builder
	builder.WriteString("%{for ")
	if len(expr.KeyVar) > 0 {
		builder.WriteString(expr.KeyVar)
		builder.WriteString(", ")
	}
	builder.WriteString(expr.ValVar)
	builder.WriteString(" in ")
	builder.WriteString(c.rangeSource(expr.CollExpr.Range()))
	builder.WriteString("}")
	templ, err := c.convertStringPart(expr.ValExpr)
	if err != nil {
		return "", err
	}
	builder.WriteString(templ)
	builder.WriteString("%{endfor}")

	return builder.String(), nil
}

func (c *converter) wrapExpr(expr hclsyntax.Expression) string {
	return "${" + c.rangeSource(expr.Range()) + "}"
}
