package main

import (
	"flag"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"io/ioutil"
	"bytes"

	jsonParser "github.com/hashicorp/hcl/json/parser"
	"github.com/hashicorp/hcl/hcl/printer"
)

// VERSION is what is returned by the `-v` flag
var Version = "development"

func main() {
	version := flag.Bool("version", false, "Prints current app version")
	flag.Parse()
	if *version {
		fmt.Println(Version)
		return
	}
	
	argsWithoutProg := os.Args[1:]
	terrahubComponent := ""
	terrahubComponentPath := ""
	cashPath := ""
	if len(argsWithoutProg) > 0 {
		cashPath = os.Args[1]
	}	
	if len(argsWithoutProg) > 1 {
		terrahubComponentPath = os.Args[2]
	}	
	if len(argsWithoutProg) > 2 {
		terrahubComponent = os.Args[3]
	}	
	cashComponentPath := PrepareJSON(terrahubComponent)
	if cashComponentPath != "" {		
		GenerateHcl(cashPath + "/" + cashComponentPath + "/", terrahubComponentPath)
	}
	
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
	re := regexp.MustCompile(`(?m).+?✅`)
	for _, match := range re.FindAllString(sha, -1) {
		match = strings.Replace(match,"✅","",-1)
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
			StartProccesingFile(sourcePath + file.Name(), destinationPath + "/" + file.Name())
		}
	}
	ProccesingDotTerrahub(destinationPath + "/.terrahub.yml")
}

func StartProccesingFile(source string, destination string) {
	input, _ := ioutil.ReadFile(source)		
	sourceValue := strings.Replace(string(input),"null","",-1)
	sourceValue = strings.Replace(sourceValue,"NULL","",-1)
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
	input = strings.Replace(input, "\"resource\"", "resource",-1)
	input = strings.Replace(input, "\"data\"", "data",-1)
	input = strings.Replace(input, "\"output\"", "output",-1)
	input = strings.Replace(input, "\"module\"", "module",-1)
	input = strings.Replace(input, "\"provider\"", "provider",-1)
	input = strings.Replace(input, "\"backend\"", "backend",-1)
	input = strings.Replace(input, "\"variable\"", "variable",-1)
	re := regexp.MustCompile(`(?m)\".+?\" =`)
	for _, match := range re.FindAllString(input, -1) {
		input = strings.Replace(input, match, strings.Replace(match,"\"","",-1),-1)
	}	
	input = strings.Replace(input,"\\n","\n",-1)
	input = strings.Replace(input,"\\","",-1)
	return []byte(input)
}

func ProccesingDotTerrahub(source string) {
	input, _ := ioutil.ReadFile(source)
	endIndex := strings.Index(string(input), "  template:")
	startIndex := strings.Index(string(input), "## build config")
	sourceValue := string(input)[:endIndex]
	if startIndex > -1 {
		sourceValue += "\n" + string(input)[startIndex:]
	}
	sourceValue = strings.Replace(sourceValue,"\\n","\n",-1)
	sourceValue = strings.Replace(sourceValue,"\\","",-1)
	ioutil.WriteFile(source, []byte(sourceValue), 0777)
}
