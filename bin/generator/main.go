package main

import (
	"flag"
	"fmt"
	"os"

	generator "generator/generator"
)

// VERSION is what is returned by the `-v` flag
var Version = "development"

func main() {
	version := flag.Bool("version", false, "Prints current app version")
	toYml := flag.Bool("toyml", false, "Input HCL folder, output yml file")
	flag.Parse()
	if *version {
		fmt.Println(Version)
		return
	}

	if *toYml {
		ConvertToYml()
		return
	}

	GenerationTemplates()
}

// GenerationTemplates - Generation templates files
func GenerationTemplates() {
	argsWithoutProg := os.Args[1:]
	providers := []string{"aws", "google", "azurerm"}
	destination := "./templates/"
	if len(argsWithoutProg) > 0 {
		providers = []string{os.Args[1]}
	}
	if len(argsWithoutProg) > 1 {
		destination = os.Args[2]
	}
	for _, provider := range providers {
		downloaded := generator.DownloadFromGit(
			"https://github.com/terraform-providers/terraform-provider-" + provider + ".git")

		if downloaded {
			generator.DeleteFolder(destination + provider)
			generator.Generation(provider, "./terraform-provider-"+provider+"/"+provider+"/", destination)
			generator.DeleteFolder("./terraform-provider-" + provider)
		}
	}
}

// ConvertToYml - Cnvert tf to yml
func ConvertToYml() {
	argsWithoutProg := os.Args[2:]
	source := ""
	destination := "./terrahub/"
	if len(argsWithoutProg) > 0 {
		source = os.Args[2]
	}
	if len(argsWithoutProg) > 1 {
		destination = os.Args[3]
	} else {
		destination = source
	}
	if source == "" {
		fmt.Println("The source path is not set!")
	} else {
		generator.ParsingTfFile(source, destination)
	}
}
