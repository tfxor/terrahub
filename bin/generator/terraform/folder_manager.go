package terraform

import (
	"fmt"
	"io/ioutil"
	"os/exec"
	"os"
	"io"
)

func DownloadFromGit(url string) bool {
	fmt.Println("git clone " + url)
	cmd := exec.Command("git", "clone", url)
	if err := cmd.Run(); err != nil {
		fmt.Println(err)
		return false
	}
	fmt.Println("Success")
	return true
}

func DeleteEmptyFolder(url string) bool {
	if !IsDirEmpty(url) {
		return true
	}
	cmd := exec.Command("rm", "-rf", url)
	if err := cmd.Run(); err != nil {
		fmt.Println(err)
		return false
	}
	return true
}

func DeleteFolder(url string) bool {
	fmt.Println("Delete folder " + url)
	cmd := exec.Command("rm", "-rf", url)
	if err := cmd.Run(); err != nil {
		fmt.Println(err)
		return false
	}
	fmt.Println("Success")
	return true
}

func DeleteFile(path string) {
	_, err := ioutil.ReadFile(path)
	if err == nil {
		cmd := exec.Command("rm", path)
		if err := cmd.Run(); err != nil {
			fmt.Println(err)
		}
	}
}

func CreateFolder(path string) {
	cmd := exec.Command("mkdir", path)
	if err := cmd.Run(); err != nil {
		fmt.Println(err)
	}
}

func IsDirEmpty(name string) bool {
	f, err := os.Open(name)
	if err != nil {
			return false
	}
	defer f.Close()

	_, err = f.Readdir(1)

	if err == io.EOF {
			return true
	}
	return false
}
