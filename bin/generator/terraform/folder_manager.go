package terraform

import (
  "fmt"
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
