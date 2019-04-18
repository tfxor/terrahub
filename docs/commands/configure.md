# terrahub configure

```text
Usage: terrahub configure [options]

terrahub@0.0.1 (built: 2018-04-14T19:15:39.787Z)
this command will add, change or remove config parameters from terrahub config files

Options:
  --config, -c           Create, update or delete config parameter from config file
  --global, -G           Update global config file instead of root or local
  --delete, -D           Delete corresponding configuration parameter
  --auto-approve, -y     Auto approve for delete option
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
