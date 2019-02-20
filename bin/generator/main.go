package main

import (
	"flag"
	"fmt"
	"os"

	"generator/terraform"
)

// VERSION is what is returned by the `-v` flag
var Version = "development"

func main() {
	version := flag.Bool("version", false, "Prints current app version")
	toYml := flag.Bool("toyml", false, "Input HCL folder, output yml file")
	toymlfolder := flag.Bool("toymlfolder", false, "Input HCL folder, output yml folder")
	thub := flag.Bool("thub", false, "Normalize HCL and YAML")
	flag.Parse()
	if *version {
		fmt.Println(Version)
		return
	}

	if *toYml {
		ConvertToYml()
		return
	}

	if *toymlfolder {
		ConvertFolderToYml()
		return
	}

	if *thub {
		NormalizeTHub()
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
		downloaded := terraform.DownloadFromGit(
			"https://github.com/terraform-providers/terraform-provider-" + provider + ".git")

		if downloaded {
			terraform.DeleteFolder(destination + provider)
			terraform.Generation(provider, "./terraform-provider-"+provider+"/"+provider+"/", destination)
			terraform.DeleteFolder("./terraform-provider-" + provider)
		}
	}
}

// ConvertToYml - Convert tf to yml
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
		terraform.ParsingTfFile(source, destination)
	}
}

// ConvertFolderToYml - Convert tf to yml
func ConvertFolderToYml() {
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
		terraform.ParsingFolderTfFile(source, destination)
	}
}

// NormalizeTHub - Normalize
func NormalizeTHub() {
	argsWithoutProg := os.Args[2:]
	projectFolder := "./"
	source := ""
	destination := "./terrahub/"
	env := ""
	if len(argsWithoutProg) > 0 {
		projectFolder = os.Args[2]
	}
	if len(argsWithoutProg) > 1 {
		source = os.Args[3]
	}
	if len(argsWithoutProg) > 2 {
		destination = os.Args[4]
	} else {
		destination = source
	}
	if len(argsWithoutProg) > 3 {
		env = os.Args[5]
	}
	if source == "" {
		fmt.Println("The source path is not set!")
	} else {
		terraform.Normalize(projectFolder, source, destination, env)
	}
}
