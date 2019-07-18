package main

import (
	"os"
	"fmt"
	"flag"
	"strings"
	"strconv"
	// "io/ioutil"
	"encoding/json"
	
	"github.com/hashicorp/hcl2/hclwrite"
)

type Map map[string]json.RawMessage
type Array []json.RawMessage

var (
	input   = ""
	Version = "development"
	interpolation = ""
	interpolationList = []string{
		"provider",
	}
	functionList = []string{
		"path", "local", "var", "module", "data", "string",
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
		"provider",
	}
	resourceDoNotPrint = []string{
		"locals", "terraform", "data", "resource",
	}
)

func init() {
	version := flag.Bool("v", false, "Prints current app version")
	flag.StringVar(&input, "i", "", "Input string")
	
	flag.Parse()

	if *version {
		fmt.Println(Version)
		return
	}
}

func main() {
	// inputFile, _ := ioutil.ReadFile(input)
	
	// var tmpJ json.RawMessage
	// json.Unmarshal(inputFile, &tmpJ)
	var outHCL2 = hclwrite.Format([]byte(walkJson([]byte(input), 0, "", "", "")))
	// var outHCL2 = hclwrite.Format([]byte(walkJson(tmpJ, 0, "", "", "")))
	os.Stdout.WriteString(string(outHCL2))
}

func Contains(a []string, x string) bool {
    for _, n := range a {
        if x == n {
            return true
        }
	}
	
    return false
}

func walkJson(raw json.RawMessage, level int, outHCL2 string, resourceType string, lastIndex string) string {
	if raw[0] == 123 { //  123 is `{` => object
		var cont Map
		json.Unmarshal(raw, &cont)
		for i, v := range cont {
			if Contains(resourceTypeList, i) {
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
				case "module", "output", "variable":
					outHCL2 += mapIn2Level(i, level, v)
				case "resource", "data":
					outHCL2 += mapIn3Level(i, level, v, lastIndex, resourceType)
				default:
					outHCL2 += mapIn(i, level, v, resourceType)
			}
						
			outHCL2 += walkJson(v, level + 1, "", resourceType, i)
			
			switch resourceType {
				case "locals":
					outHCL2 += mapOut1Level(v)
				case "terraform":
					outHCL2 += mapOut1LevelAndSubLevel(level, v)
				case "module", "output", "variable":
					outHCL2 += mapOut2Level(level, v)
				case "resource", "data":
					outHCL2 += mapOut3Level(level, v)
				default:
					outHCL2 += mapOut(level, v)
			}
		}
	} else if raw[0] == 91 { // 91 is `[`  => array
		var cont Array
		json.Unmarshal(raw, &cont)
		for i, v := range cont {
			if interpolation != "" && level < 2 {
				outHCL2 += walkJson(v, 1, "", resourceType, "")
			} else {			
				if i == 0 {
					outHCL2 += " [\n"
				}			
				outHCL2 += walkJson(v, level + 1, "", resourceType, "")
				if i < len(cont)-1 {
					outHCL2 = outHCL2[0:len(outHCL2) - 1] + ",\n"
				} else {
					outHCL2 += "]\n"
				}
			}
		}

	} else {
		var val interface{}
		json.Unmarshal(raw, &val)
		switch v := val.(type) {
			case float64:
				outHCL2 += strconv.Itoa(int(v)) + "\n"
			case string:
				if isFunction(v) {
					outHCL2 += v + "\n"
				} else {
					outHCL2 +="\"" + v + "\"\n"
				}			
			case bool:
				outHCL2 += strconv.FormatBool(v) + "\n"
			case nil:
				outHCL2 += ""
			default:
				outHCL2 += "unkown type"
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

func mapIn1LevelAndSubLevel(i string, level int, raw json.RawMessage) string {
	var outHCL2 = ""
	switch level {
		case 0, 1:
			outHCL2 = i
		case 2:
			outHCL2 = "\"" + i + "\""
		default:
			outHCL2 = i + " = "
	}
	if raw[0] == 123 && level != 1 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapIn2Level(i string, level int, raw json.RawMessage) string {
	var outHCL2 = ""
	switch level {
		case 0:
		case 1:
			outHCL2 = "\"" + i + "\""
		default:
			outHCL2 = i + " = "
	}
	if raw[0] == 123 && level >= 1 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapIn3Level(i string, level int, raw json.RawMessage, lastIndex string, resourceType string) string {
	var outHCL2 = ""
	switch level {
		case 0:
		case 1:
		case 2:
			outHCL2 = resourceType + " \"" + lastIndex + "\" \"" + i + "\""
		default:
			outHCL2 = i + " ="
	}
	if raw[0] == 123 && level >= 2 {
		outHCL2 += " {\n"
	}

	return outHCL2
}

func mapIn(i string, level int, raw json.RawMessage, resourceType string) string {
	var outHCL2 string

	if interpolation != "" && level == 1 {
		outHCL2 = " \"" + i + "\" "
	} else if raw[0] != 91 || level > 0 || resourceType == "" {
		outHCL2 = i + " ="
	}

	if raw[0] == 123{
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

func mapOut(level int, raw json.RawMessage) string {
	var outHCL2 = ""
	
	if raw[len(raw)-1] == 125 {
		outHCL2 = "}\n"
	}

	return outHCL2
}

func isFunction(val string) bool {
	for _, element := range functionList {
		startIndex := strings.Index(val, element)
		if startIndex == 0 {
			return true
		}
	}

	return false
}
