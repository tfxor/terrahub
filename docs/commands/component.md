# terrahub component

```text
Usage: terrahub component [options]

terrahub@0.0.1 (built: 2018-04-14T19:15:39.787Z)
this command will create new or include existing terraform configuration into current terrahub project

Options:
  --name, -n          Uniquely identifiable cloud resource name
  --template, -t      Template name (e.g. aws_ami, google_project)
  --directory, -d     Path to the component (default: cwd)
  --depends-on, -o    List of paths to components that depend on current component (comma separated)
  --force, -f         Replace directory. Works only with template option
  --delete, -D        Delete terrahub configuration files in the component folder
  --env, -e           Workspace environment
  --help, -h          Show list of available commands
```
