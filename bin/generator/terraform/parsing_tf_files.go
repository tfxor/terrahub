package proccesing

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"regexp"	
	// "os/exec"

	"github.com/hashicorp/hcl"
	"github.com/ghodss/yaml"
)

// ParsingTfFile - parsing all tf file from directory
func ParsingTfFile(source string, destination string) {
	fmt.Println("Start reading path: " + source)
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
		if strings.Index(file.Name(), ".tf") > -1 &&
			strings.Index(file.Name(), ".tfvars") == -1 {
			fmt.Println("Read file: " + file.Name())			
			newYml += StartProccesingTfFile(source + file.Name())
			// if source == destination {
			// 	cmd := exec.Command("rm", "-rf", source + file.Name())
			// 	if err := cmd.Run(); err != nil {
			// 		fmt.Println(err)
			// 	}
			// }
		}
	}
	newYml = strings.Replace(newYml, "\n", "\n    ", -1)
	newYml = PrepareNewYmlFromOld(source, "  template:\n    " + newYml)
	ioutil.WriteFile(destination + ".terrahub.yml", []byte(newYml), 0777)
	fmt.Println("Success")
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
	
	y, err := yaml.JSONToYAML(jsonLoad)
	if err != nil {
		panic(err)
	}
	
	return string(y)
}

// PrepareNewYmlFromOld - Prepare new yml from old
func PrepareNewYmlFromOld(source string, context string) string {	
	newYml := ""
	oldYml, err := ioutil.ReadFile(source + ".terrahub.yml")
	if err != nil {
		paths := strings.Split(source, "/")
		newYml += "## local config\n" +
			"component:\n" +
			"  name: '"+paths[len(paths)-2]+"'\n" + context
	} else {
		re := regexp.MustCompile(`(?m)  name: .+?\n`)
		for _, match := range re.FindAllString(string(oldYml), -1) {
			newYml = strings.Replace(string(oldYml), match, match + context, 1)
		}
	}
	return newYml
}
