package generator

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// Generation - Generation templates from go files
func Generation(provider string, source string, destination string) {
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

	for _, file := range fileInfo {
		if strings.Index(file.Name(), "resource_") > -1 &&
			strings.Index(file.Name(), "_test") == -1 {
			fmt.Println("Read file: " + file.Name())
			StartProccesingFile(source, destination, file.Name(), provider)
		}
	}
}

// StartProccesingFile - Start proccesing
func StartProccesingFile(source string, destination string, fileName string, provider string) {
	err, result, existID := ParsingFile(source, fileName, provider)
	
	if err {
		fmt.Println("=====Error=====")
		fmt.Println("Provider: " + provider)
		fmt.Println("File: " + fileName)
		fmt.Println("Error: " + result)
		return
	}

	jsonMap := make(map[string]interface{})
	errJson := json.Unmarshal([]byte(result), &jsonMap)
	if errJson != nil {
		panic(errJson)
	}
	fileName = fileName[0 : len(fileName)-3]
	fileName = strings.Replace(fileName, "resource_", "", -1)
	fileName = strings.Replace(fileName, provider+"_", "", -1)
	fileName = strings.Replace(fileName, ".go", "", -1)
	templatePath := destination + provider + "/" + fileName + "/.terrahub.yml.twig"
	if _, err := os.Stat(templatePath); os.IsNotExist(err) {
		merr := os.MkdirAll(destination+provider+"/"+fileName, os.ModePerm)
		if merr != nil {
			panic(merr)
		}
		_, cerr := os.Create(templatePath)
		if cerr != nil {
			fmt.Println(cerr)
		}
		fmt.Println("Generation template: " + templatePath)
		// fmt.Println(existID)
		GenerateYml(
			GenerateYmlParam{
				templatePath,
				jsonMap,
				provider + "_" + fileName,
				existID,
				provider})
	}
}
