package terraform

import (
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
func ParsingFolderTfFile(source string, destination string) {
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
			ParsingTfFile(source+file.Name()+"/", destination+file.Name()+"/")
		}
	}
}

// ParsingTfFile - parsing all tf file from directory
func ParsingTfFile(source string, destination string) {
	f, err := os.Open(source)
	if err != nil {
		fmt.Println(err)
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
			newYml += StartProccesingTfFile(source + file.Name())
			if source == destination {
				DeleteFile(source + file.Name())
			}
		}
	}
	if source == destination {
		DeleteFile(source + "locals.tf")
		DeleteFile(source + "default.tfvars")
	}

	ioutil.WriteFile(destination+".terrahub.yml", []byte(RefactoringYml(source, newYml)), 0777)
}

func RefactoringYml(source string, newYml string) string {
	newYml = strings.Replace(newYml, "\n", "\n    ", -1)
	newYml = strings.Replace(newYml, "- ", "  ", -1)
	newYml = PrepareNewYmlFromOld(source, "  template:\n    "+newYml)
	re := regexp.MustCompile(`(?m)\n(.+?|){}`)
	for _, match := range re.FindAllString(newYml, -1) {
		newYml = strings.Replace(newYml, match, " {}", 1)
	}
	return newYml
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

func NormalizeJson(jsonLoad []byte) []byte {
	var m map[string]interface{}
	err := json.Unmarshal(jsonLoad, &m)
	if err != nil {
		panic(err)
	}
	uniqKeys := CheckElementByType([]Element{}, m)

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

func CheckElementByType(uniqKeys []Element, m map[string]interface{}) []Element {
	for k, v := range m {
		switch v.(type) {
		case []interface{}:
			element := m[k].([]interface{})
			for key, value1 := range element {
				switch value1.(type) {
				case map[string]interface{}:
					keys := Keys{k, key, ""}
					uniqKeys = CheckElementByTypeStep3(uniqKeys, m, keys, element)
				}
			}
		}
	}
	return uniqKeys
}

func CheckElementByTypeStep3(uniqKeys []Element, m map[string]interface{}, keys Keys, element []interface{}) []Element {
	element2 := element[keys.SK].(map[string]interface{})
	for key2, value2 := range element2 {
		switch value2.(type) {
		case []interface{}:
			if !Contains(uniqKeys, key2) {
				elements := make([]interface{}, 0)
				elements = append(elements, value2)
				uniqKeys = append(uniqKeys, Element{keys.GK, keys.SK, key2, elements})
			} else {
				lE := uniqKeys[ReturnElement(uniqKeys, key2)]
				lE.Elements = append(lE.Elements, value2)
				m[keys.GK].([]interface{})[keys.SK] = nil
			}
		}
	}
	return uniqKeys
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
func PrepareNewYmlFromOld(source string, context string) string {
	newYml := ""
	context = AddTfVars(source, context)
	oldYml, err := ioutil.ReadFile(source + ".terrahub.yml")
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

// AddTfVars - Add tfvars values
func AddTfVars(source string, context string) string {
	newYml := ""
	_, err := ioutil.ReadFile(source + "default.tfvars")
	if err != nil {
		return context
	}

	newYml = StartProccesingTfFile(source + "default.tfvars")
	re := regexp.MustCompile(`(?m).+?\n`)
	for _, match := range re.FindAllString(newYml, -1) {
		newYml = strings.Replace(newYml, match, "      "+match, 1)
	}
	newYml = strings.Replace(newYml, "- ", "  ", -1)
	return context + "tfvars:\n" + newYml
}
