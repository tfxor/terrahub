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
	thub := flag.Bool("thub", false, "Normalize HCL and YAML")
	recursively := flag.Bool("recursively", false, "Scan folder recursively")
	flag.Parse()
	if *version {
		fmt.Println(Version)
		return
	}

	if *toYml {
		ConvertToYml(*recursively)
		return
	}

	if *thub {
		NormalizeTHub(*recursively)
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
func ConvertToYml(recursively bool) {
	countelement := 2
	argsWithoutProg := os.Args[countelement:]
	if len(argsWithoutProg) < countelement {
		fmt.Println("Set please all params!")
		return
	}
	if recursively {
		countelement++
	}
	source := os.Args[countelement]
	destination := os.Args[countelement+1]

	if recursively {
		terraform.ParsingFolderTfFile(source, destination)
	} else {
		terraform.ParsingTfFile(source, destination)
	}
}

// NormalizeTHub - Normalize
func NormalizeTHub(recursively bool) {
	countelement := 2
	argsWithoutProg := os.Args[countelement:]
	if len(argsWithoutProg) < countelement {
		fmt.Println("Set please all params!")
		return
	}
	if recursively {
		countelement++
	}
	source := os.Args[countelement]
	destination := os.Args[countelement+1]
	env := ""
	if len(argsWithoutProg) > countelement+1 {
		env = os.Args[countelement+2]
	}
	if recursively {
		terraform.NormalizeFolder(source, destination, env)
	} else {
		terraform.Normalize(source, destination, env)
	}
}
