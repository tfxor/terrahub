package terraform

import (
	"fmt"
	"io"
	"os"
	"os/exec"
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
	if err := os.RemoveAll(url); err != nil {
		fmt.Println(err)
		return false
	}
	return true
}

func DeleteFolder(url string) bool {
	fmt.Println("Delete folder " + url)
	if err := os.RemoveAll(url); err != nil {
		fmt.Println(err)
		return false
	}
	fmt.Println("Success")
	return true
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
