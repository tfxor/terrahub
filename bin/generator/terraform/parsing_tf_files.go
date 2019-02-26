package terraform

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"

	"github.com/ghodss/yaml"
	"github.com/hashicorp/hcl"
)

type Keys struct {
	GK string
	SK int
	EK string
}

type Element struct {
	GK       string
	SK       int
	EK       string
	Elements []interface{}
}

// ParsingFolderTfFile - parsing all tf file from directory
func ParsingFolderTfFile(source string, destination string, envs ...string) {
	f, err := os.Open(source)
	if err != nil {
		fmt.Println(err)
	}
	fileInfo, err := f.Readdir(-1)
	f.Close()
	if err != nil {
		fmt.Println(err)
	}
	for _, file := range fileInfo {
		if file.IsDir() {
			_, err := os.Open(destination + file.Name())
			if err != nil {
				CreateFolder(destination + file.Name())
			}
			switch len(envs) {
			case 1:
				ParsingTfFile(source+file.Name()+"/", destination+file.Name()+"/", envs[0])
			case 2:
				ParsingTfFile(source+file.Name()+"/", destination+file.Name()+"/", envs[0], envs[0])
			default:
				ParsingTfFile(source+file.Name()+"/", destination+file.Name()+"/")
			}
		}
	}
}

var workspace string

// ParsingTfFile - parsing all tf file from directory
func ParsingTfFile(source string, destination string, envs ...string) {
	env := "default"
	configFileName := ""
	workspace = ""
	switch len(envs) {
	case 1:
		env = envs[0]
		configFileName = "." + env
		workspace = "workspace/"
	case 2:
		env = envs[0]
		configFileName = "." + env
		workspace = envs[1]
	}
	f, err := os.Open(source + workspace)
	if err != nil {
		return
	}
	fileInfo, err := f.Readdir(-1)
	f.Close()
	if err != nil {
		fmt.Println(err)
	}
	newYml := ""
	for _, file := range fileInfo {
		if file.Name()[len(file.Name())-3:] == ".tf" &&
			!file.IsDir() &&
			strings.Index(file.Name(), "locals.tf") == -1 {
			newYml += StartProccesingTfFile(source + workspace + file.Name())
			if source+workspace == destination {
				DeleteFile(source + workspace + file.Name())
			}
		}
	}
	if source+workspace == destination {
		DeleteFile(source + workspace + "locals.tf")
	}

	ioutil.WriteFile(destination+".terrahub"+configFileName+".yml", []byte(RefactoringYml(source+workspace, newYml, env, configFileName)), 0777)
	DeleteEmptyFolder(source + workspace)
}

func RefactoringYml(source string, newYml string, env string, configFileName string) string {
	interYml := ""
	scanner := bufio.NewScanner(strings.NewReader(newYml))
	for scanner.Scan() {
		interYml += "\n    " + scanner.Text()
	}
	newYml = ScanRec(interYml)
	newYml = strings.Replace(newYml, "# ", "  ", -1)
	newYml = PrepareNewYmlFromOld(source, "  template:"+newYml, env, configFileName)
	re := regexp.MustCompile(`(?m)\n(.+?|){}`)
	for _, match := range re.FindAllString(newYml, -1) {
		newYml = strings.Replace(newYml, match, " {}", 1)
	}
	if env == "default" {
		return newYml + "\n"
	}
	return newYml
}

func ScanRec(interYml string) string {
	newYml := ""
	scanner := bufio.NewScanner(strings.NewReader(interYml))
	for scanner.Scan() {
		line := scanner.Text()
		spaces := SpaceCount(line)
		isVariable := strings.Index(line, ":")
		if spaces <= 10 && isVariable != -1 {
			line = strings.Replace(line, "- - ", "# ", 1)
			line = strings.Replace(line, "- ", "  ", 1)
		}
		if spaces >= 10 {
			line = line[2:]
		}

		newYml += line + "\n"
	}
	return newYml
}

func SpaceCount(line string) int {
	spaces := 0
	for _, v := range line {
		if v != ' ' {
			break
		}
		spaces++
	}
	return spaces
}

// StartProccesingTfFile - Start proccesing
func StartProccesingTfFile(filePath string) string {
	input, _ := ioutil.ReadFile(filePath)

	var v interface{}
	err := hcl.Unmarshal(input, &v)
	if err != nil {
		panic(err)
	}

	jsonLoad, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		panic(err)
	}

	y, err := yaml.JSONToYAML(NormalizeJson(jsonLoad))
	if err != nil {
		panic(err)
	}

	return string(y)
}

var uniqKeys []Element

func NormalizeJson(jsonLoad []byte) []byte {
	var m map[string]interface{}
	err := json.Unmarshal(jsonLoad, &m)
	if err != nil {
		panic(err)
	}
	uniqKeys = []Element{}
	CheckElementByType(m)
	for _, value := range uniqKeys {
		if m[value.GK].([]interface{})[value.SK] != nil {
			m[value.GK].([]interface{})[value.SK].(map[string]interface{})[value.EK] = value.Elements
		}
	}

	jsonLoad, err = json.Marshal(m)

	if err != nil {
		fmt.Println("error:", err)
	}
	newJson := strings.Replace(string(jsonLoad), ",null", "", -1)
	return []byte(newJson)
}

func CheckElementByType(m map[string]interface{}) {
	for k, v := range m {
		switch v.(type) {
		case []interface{}:
			element := m[k].([]interface{})
			for key, value1 := range element {
				switch value1.(type) {
				case map[string]interface{}:
					keys := Keys{k, key, ""}
					CheckElementByTypeStep3(m, keys, element)
				}
			}
		}
	}
}

func CheckElementByTypeStep3(m map[string]interface{}, keys Keys, element []interface{}) {
	element2 := element[keys.SK].(map[string]interface{})
	for key2, value2 := range element2 {
		switch value2.(type) {
		case []interface{}:
			if !Contains(uniqKeys, key2) {
				elements := make([]interface{}, 0)
				elements = append(elements, value2)
				uniqKeys = append(uniqKeys, Element{keys.GK, keys.SK, key2, elements})
			} else {
				lEKey := ReturnElement(uniqKeys, key2)
				uniqKeys[lEKey].Elements = append(uniqKeys[lEKey].Elements, value2)
				m[keys.GK].([]interface{})[keys.SK] = nil
			}
		}
	}
}

func Contains(arr []Element, str string) bool {
	for _, a := range arr {
		if a.EK == str {
			return true
		}
	}
	return false
}

func ReturnElement(arr []Element, str string) int {
	for key, a := range arr {
		if a.EK == str {
			return key
		}
	}
	return 0
}

// PrepareNewYmlFromOld - Prepare new yml from old
func PrepareNewYmlFromOld(source string, context string, env string, configFileName string) string {
	newYml := ""
	context = AddTfVars(source, context, env)
	if env != "default" {
		return ProcessingEnv(source[:len(source)-len(workspace)], context, env, configFileName)
	}
	oldYml, err := ioutil.ReadFile(source + ".terrahub" + configFileName + ".yml")
	if err != nil {
		paths := strings.Split(source, "/")
		return newYml + "## local config\n" +
			"component:\n" +
			"  name: '" + paths[len(paths)-2] + "'\n" + context
	}
	replaced := true
	re := regexp.MustCompile(`(?m)\n\n`)
	for _, match := range re.FindAllString(string(oldYml), -1) {
		replaced = false
		newYml = strings.Replace(string(oldYml), match, "\n"+context+"\n", 1)
	}
	if replaced {
		newYml += string(oldYml) + context
	}
	return newYml
}

func ProcessingEnv(source string, context string, env string, configFileName string) string {
	oldYml, err := ioutil.ReadFile(source + ".terrahub" + configFileName + ".yml")
	if err != nil {
		return "## " + env + " config\n" + context
	}
	if string(oldYml) == "{}\n" || string(oldYml) == "" {
		return "## " + env + " config\n" +
			"component:\n" + context + "\n"
	}
	return "## " + env + " config\n" +
		"component:\n" + context + "\n\n" + string(oldYml)
}

// AddTfVars - Add tfvars values
func AddTfVars(source string, context string, env string) string {
	newYml := ""
	_, err := ioutil.ReadFile(source + env + ".tfvars")
	if err != nil {
		return context
	}

	newYml = StartProccesingTfFile(source + env + ".tfvars")
	interYml := ""
	scanner := bufio.NewScanner(strings.NewReader(newYml))
	for scanner.Scan() {
		interYml += "\n      " + scanner.Text()
	}
	DeleteFile(source + env + ".tfvars")
	if env == "default" {
		return context + "    tfvars:" + interYml
	}
	return context + "\n    tfvars:" + interYml
}
