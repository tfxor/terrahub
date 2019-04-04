package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"regexp"
	"strings"

	ymlto "github.com/ghodss/yaml"
	"github.com/hashicorp/hcl/hcl/printer"
	jsonParser "github.com/hashicorp/hcl/json/parser"
)

// VERSION is what is returned by the `-v` flag
var Version = "development"

func main() {
	version := flag.Bool("version", false, "Prints current app version")
	tohcl := flag.Bool("tohcl", false, "Prints current app version")
	thub := flag.Bool("thub", false, "Prints current app version")
	flag.Parse()
	if *version {
		fmt.Println(Version)
		return
	}

	if *tohcl {
		GenerateHclFromYml()
		return
	}

	if *thub {
		GenerateHclFromYml()
		GenerateHclFromYmlThubEnv()
		return
	}
}

func GenerateHclFromYml() {
	argsWithoutProg := os.Args[2:]
	if len(argsWithoutProg) < 3 {
		fmt.Println("Set please all params!")
		return
	}
	cashPath := os.Args[2]
	terrahubComponentPath := os.Args[3]
	terrahubComponent := os.Args[4]
	cashComponentPath := PrepareJSON(terrahubComponent)
	if cashComponentPath != "" {
		GenerateHcl(cashPath+"/"+cashComponentPath+"/", terrahubComponentPath)
	}
}

func GenerateHclFromYmlThubEnv() {
	terrahubComponentPath := os.Args[3]
	f, err := os.Open(terrahubComponentPath)
	if err != nil {
		fmt.Println(err)
	}
	fileInfo, err := f.Readdir(-1)
	f.Close()
	if err != nil {
		fmt.Println(err)
	}
	CreateFolder(terrahubComponentPath + "/workspace")
	for _, file := range fileInfo {
		if !file.IsDir() && strings.Index(file.Name(), ".yml") > -1 && strings.Index(file.Name(), "terrahub.yml") == -1 {
			StartProccesingFileEnv(terrahubComponentPath+"/"+file.Name(), file.Name(), terrahubComponentPath)
		}
	}
}

func StartProccesingFileEnv(source string, fileName string, destination string) {
	y := GetTfvarsTerrahubEnv(source)
	if len(y) > 0 {
		j1, _ := ymlto.YAMLToJSON(y)
		ast, err := jsonParser.Parse(j1)
		if err != nil {
			fmt.Printf("unable to parse JSON: %s", err)
		}
		var b bytes.Buffer
		err = printer.Fprint(&b, ast)
		if err != nil {
			fmt.Printf("unable to print HCL: %s", err)
		}
		env := strings.Replace(fileName, ".terrahub.", "", -1)
		env = strings.Replace(env, ".yml", "", -1)
		ioutil.WriteFile(destination+"/workspace/"+env+".tfvars", Clearing(b.String()), 0777)
	}
	ProccesingDotTerrahubEnv(source)
}

func PrepareJSON(terrahubComponent string) string {
	var (
		cmdOut []byte
		err    error
	)
	cmdName := "terrahub"
	cmdArgs := []string{"prepare", "-i", terrahubComponent}
	if cmdOut, err = exec.Command(cmdName, cmdArgs...).Output(); err != nil {
		fmt.Fprintln(os.Stderr, "There was an error running terrahub rev-parse command: ", err)
		os.Exit(1)
	}
	sha := string(cmdOut)
	re := regexp.MustCompile(`(?m).+?\n`)
	for _, match := range re.FindAllString(sha, -1) {
		match = strings.Replace(match, "\n", "", -1)
		return match
	}
	return ""
}

func GenerateHcl(sourcePath string, destinationPath string) {
	f, err := os.Open(sourcePath)
	if err != nil {
		fmt.Println(err)
	}
	fileInfo, err := f.Readdir(-1)
	f.Close()
	if err != nil {
		fmt.Println(err)
	}

	for _, file := range fileInfo {
		if !file.IsDir() && strings.Index(file.Name(), ".tf") > -1 {
			StartProccesingFile(sourcePath+file.Name(), destinationPath+"/"+file.Name())
		}
	}
	ProccesingDotTerrahub(destinationPath + "/.terrahub.yml")
}

func StartProccesingFile(source string, destination string) {
	input, _ := ioutil.ReadFile(source)
	sourceValue := strings.Replace(string(input), "null", "", -1)
	sourceValue = strings.Replace(sourceValue, "NULL", "", -1)
	ast, err := jsonParser.Parse([]byte(sourceValue))
	if err != nil {
		fmt.Printf("unable to parse JSON: %s", err)
	}
	var b bytes.Buffer
	err = printer.Fprint(&b, ast)
	if err != nil {
		fmt.Printf("unable to print HCL: %s", err)
	}
	ioutil.WriteFile(destination, Clearing(b.String()), 0777)
}

func Clearing(input string) []byte {
	input = strings.Replace(input, "\"resource\"", "resource", -1)
	input = strings.Replace(input, "\"data\"", "data", -1)
	input = strings.Replace(input, "\"output\"", "output", -1)
	input = strings.Replace(input, "\"module\"", "module", -1)
	input = strings.Replace(input, "\"provider\"", "provider", -1)
	input = strings.Replace(input, "\"terraform\"", "terraform", -1)
	input = strings.Replace(input, "\"backend\"", "backend", -1)
	input = strings.Replace(input, "\"variable\"", "variable", -1)
	re := regexp.MustCompile(`(?m)\".+?\" =`)
	for _, match := range re.FindAllString(input, -1) {
		input = strings.Replace(input, match, strings.Replace(match, "\"", "", -1), -1)
	}
	input = strings.Replace(input, "\\n", "\n", -1)
	input = strings.Replace(input, "\\", "", -1)
	return []byte(input)
}

func ProccesingDotTerrahub(source string) {
	input, _ := ioutil.ReadFile(source)
	endIndex := strings.Index(string(input), "  template:")
	startIndex := strings.Index(string(input), "build:")
	sourceValue := string(input)[:endIndex]
	if startIndex > -1 {
		sourceValue += "\n" + string(input)[startIndex:]
	}
	sourceValue = strings.Replace(sourceValue, "\\n", "\n", -1)
	sourceValue = strings.Replace(sourceValue, "\\", "", -1)
	ioutil.WriteFile(source, []byte(sourceValue), 0777)
}

func ProccesingDotTerrahubEnv(source string) {
	input, _ := ioutil.ReadFile(source)
	endIndex := strings.Index(string(input), "component:")
	startIndex := strings.Index(string(input), "build")
	sourceValue := string(input)[:endIndex]
	if startIndex > -1 {
		sourceValue += "\n" + string(input)[startIndex:]
	}
	sourceValue = strings.Replace(sourceValue, "\\n", "\n", -1)
	sourceValue = strings.Replace(sourceValue, "\\", "", -1)
	ioutil.WriteFile(source, []byte(sourceValue), 0777)
}

func GetTfvarsTerrahubEnv(source string) []byte {
	input, _ := ioutil.ReadFile(source)
	searchValue := "    tfvars:"
	startIndex := strings.Index(string(input), searchValue)
	if startIndex > -1 {
		startIndex += len(searchValue)
	}
	endIndex := strings.Index(string(input), "build")
	if endIndex < startIndex {
		endIndex = len(string(input))
	}
	if endIndex == -1 && startIndex == -1 {
		return []byte("")
	}
	sourceValue := string(input)[startIndex:endIndex]
	return []byte(sourceValue)
}

func CreateFolder(path string) {
	cmd := exec.Command("mkdir", path)
	if err := cmd.Run(); err != nil {
		fmt.Println(err)
	}
}
