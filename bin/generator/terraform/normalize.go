package terraform

import (
	"fmt"
    "io/ioutil"
	"bufio"
	"strings"
	"os"
)

var envList = []string{"test", "stage", "master", "mitocgroup"}

func ParsingFolderComponents(source string) {
	f, err := os.Open(source)
	if err != nil {
		return
	}
	fileInfo, err := f.Readdir(-1)
	f.Close()
	if err != nil {
		fmt.Println(err)
	}
	for _, file := range fileInfo {
		if file.IsDir() {
			FixVariablesInFolder(source + file.Name() + "/")
		}
	}
}

func FixVariablesInFolder(source string)  {
	f, err := os.Open(source)
	if err != nil {
		return
	}
	fileInfo, err := f.Readdir(-1)
	f.Close()
	if err != nil {
		fmt.Println(err)
	}
	for _, file := range fileInfo {
		if file.Name()[len(file.Name())-4:] == ".yml" {
			input, _ := ioutil.ReadFile(source + file.Name())
			newYml := CreateNewYml(input, 4, "provider:")
			newYml = CreateNewYml([]byte(newYml), 4, "locals:")
			newYml = CreateNewYml([]byte(newYml), 6, "account_id:", "variable:")
			newYml = CreateNewYml([]byte(newYml), 6, "region:", "variable:")
			newYml = CreateNewYml([]byte(newYml), 8, " description:", "variable:")
			newYml = CreateNewYml([]byte(newYml), 8, " default:", "variable:")
			newYml = CreateNewYml([]byte(newYml), 6, "account_id:", "tfvars:")
			newYml = CreateNewYml([]byte(newYml), 6, "region:", "tfvars:")
			newYml = strings.Replace(newYml,"var.account_id", "local.account_id", -1)
			newYml = strings.Replace(newYml,"var.region", "local.region", -1)
			newYml = strings.Replace(newYml,"## build config", "\n## build config", -1)
			newYml = ReplaceCostumeVars(newYml, file.Name())
			ioutil.WriteFile(source + file.Name(), []byte(newYml), 0777)
		}
	}
}

func ReplaceCostumeVars(input string, fileName string) string{
	if strings.Index(fileName, ".terrahub.yml") == -1 {
		input = strings.Replace(input, "custom_tags", "default_tags", -1)
		input = strings.Replace(input, "custom_vars", "default_vars", -1)
		return input
	}
	
	input = CreateNewYml([]byte(input), 6, " custom_tags:", "tfvars:")
	input = CreateNewYml([]byte(input), 6, " custom_vars:", "tfvars:")
	input = CreateNewYml([]byte(input), 6, " custom_tags:", "variable:")
	input = CreateNewYml([]byte(input), 6, " custom_vars:", "variable:")
	input = AddTypeString([]byte(input), 6, "variable:", "        type: string\n")
	input = strings.Replace(input,"tags: ${merge(var.default_tags, var.custom_tags)}",
		"tags: ${var.default_tags}", -1)
	input = strings.Replace(input,"var.default_vars, var.custom_vars", "var.default_vars", -1)
	return input
}

func AddTypeString(input []byte, spaceCount int, parentValue string, addString string) string {
	lines := []string{}
	scanner := bufio.NewScanner(strings.NewReader(string(input)))
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	itIsParent := false
	newYml := ""
	for i := 0; i<len(lines); i++ {
		line := lines[i]
		newYml += line + "\n"
		itIsParent = CheckIfItIs(itIsParent, line, 4, parentValue)
		if itIsParent && strings.Index(line, parentValue) == -1 {			
			if (SpaceCount(lines[i+1]) == spaceCount && SpaceCount(line) == spaceCount) || 
			   (SpaceCount(lines[i+1]) == spaceCount+2 && strings.Index(lines[i+1]," type:") == -1) || 
			   (SpaceCount(lines[i+1]) == spaceCount-2 && strings.Index(lines[i]," type:") == -1) {
				newYml += addString				
			}		
		}		
	}
	return newYml
}

func CreateNewYml(input []byte, spaceCount int, valueSearch string, parent ...string) string {
	newYml := ""
	scanner := bufio.NewScanner(strings.NewReader(string(input)))
	itIs := false
	itIsParent := false
	parentValue := "<<<<<<<<<<"
	if len(parent) > 0 {
		parentValue = parent[0]
	}
	for scanner.Scan() {
		line := scanner.Text()
		itIs = CheckIfItIs(itIs, line, spaceCount, valueSearch)
		if parentValue != "<<<<<<<<<<" {				
			itIsParent = CheckIfItIs(itIsParent, line, 4, parentValue)
			if !itIsParent {
				itIs = false
			}
		} 
		if !itIs {
			newYml += line + "\n"
		}
	}
	return newYml
}

func CheckIfItIs(itIs bool, line string, spaceCount int, valueSearch string) bool {
	if SpaceCount(line) > spaceCount || strings.Index(line,"  -") > -1 {
		return itIs
	}
	if strings.Index(line, valueSearch) > -1 {
		return true
	} 
	return false
}

func Normalize(projectFolder string, source string, destination string, env string)  {
	if env != "" {
		envList = []string{env}
	} else {
		ParsingFolderTfFile(source, destination)
	}
	for _, envElement := range envList {
		ParsingFolderTfFile(source, destination, envElement)
	}
	ParsingFolderComponents(source)
}
