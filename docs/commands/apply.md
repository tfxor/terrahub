# terrahub apply

```text
Usage: terrahub apply [options]

terrahub@0.0.1 (built: 2018-04-14T19:15:39.787Z)
this command will run `terraform apply` across multiple terrahub components

Options:
  --auto-approve, -y     Auto approve terraform execution
  --refresh-only, -R     Use Refresh-Only Mode to Sync Terraform State
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
