# terrahub run

```text
Usage: terrahub run [options]

terrahub@0.0.1 (built: 2018-04-14T19:15:39.787Z)
this command will execute automated workflow terraform init > workspace > plan > apply > destroy

Options:
  --apply, -a            Enable apply command as part of automated workflow
  --destroy, -d          Enable destroy command as part of automated workflow
  --auto-approve, -y     Auto approve terraform execution
  --dry-run, -u          Prints the list of components that are included in the action
  --build, -b            Enable build command as part of automated workflow
  --include, -i          List of components to include (comma separated values)
  --exclude, -x          List of components to exclude (comma separated values)
  --include-regex, -I    List of components to include (regex search)
  --exclude-regex, -X    List of components to exclude (regex search)
  --git-diff, -g         List of components to include (git diff)
  --var, -r              Variable(s) to be used by terraform
  --var-file, -l         Variable file(s) to be used by terraform
  --silent, -s           Runs the command silently (without any output)
  --env, -e              Workspace environment
  --help, -h             Show list of available commands
```
