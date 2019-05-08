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
	recursive := flag.Bool("recursive", false, "Scan folder recursive")
	flag.Parse()
	if *version {
		fmt.Println(Version)
		return
	}

	if *toYml {
		ConvertToYml(*recursive)
		return
	}

	if *thub {
		NormalizeTHub(*recursive)
		return
	}

	GenerationTemplates()
}

// GenerationTemplates - Generation templates files
func GenerationTemplates() {
	argsWithoutProg := os.Args[1:]
	providers := []string{"aws", "google", "azurerm"}
	destination := "." + string(os.PathSeparator) + "templates" +string(os.PathSeparator)
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
			source := "." + string(os.PathSeparator) + "terraform-provider-" + provider +
				string(os.PathSeparator) + provider + string(os.PathSeparator)
			terraform.Generation(provider, source, destination)
			terraform.DeleteFolder("." + string(os.PathSeparator) + "terraform-provider-" + provider)
		}
	}
}

// ConvertToYml - Convert tf to yml
func ConvertToYml(recursive bool) {
	countelement := 2
	argsWithoutProg := os.Args[countelement:]
	if len(argsWithoutProg) < countelement {
		fmt.Println("Set please all params!")
		return
	}
	if recursive {
		countelement++
	}
	source := os.Args[countelement]
	destination := os.Args[countelement+1]

	if recursive {
		terraform.ParsingFolderTfFile(source, destination)
	} else {
		terraform.ParsingTfFile(source, destination)
	}
}

// NormalizeTHub - Normalize
func NormalizeTHub(recursive bool) {
	countelement := 2
	argsWithoutProg := os.Args[countelement:]
	if len(argsWithoutProg) < countelement {
		fmt.Println("Set please all params!")
		return
	}
	if recursive {
		countelement++
	}
	source := os.Args[countelement]
	destination := os.Args[countelement+1]
	env := ""
	if len(argsWithoutProg) > countelement+1 {
		env = os.Args[countelement+2]
	}
	if recursive {
		terraform.NormalizeFolder(source, destination, env)
	} else {
		terraform.Normalize(source, destination, env)
	}
}
