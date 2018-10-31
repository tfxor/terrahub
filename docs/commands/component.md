# terrahub component

```
Usage: terrahub component [options]

terrahub@0.0.1 (built: 2018-04-07T19:15:39.787Z)
this command will create new or include existing terraform configuration into current terrahub project

Options:
  --name, -n 		 Uniquely identifiable cloud resource name
  --template, -t 	 Template name (e.g. aws_lambda_function, google_cloudfunctions_function)
  --directory, -d 	 Path to the component (default: cwd)
  --depends-on, -o 	 Paths of the components, which the component depends on (comma separated values)
  --force, -f 		 Replace directory. Works only with template option
  --env, -e 		 Workspace environment
  --help, -h 		 Show list of available commands
```


## Return
Back to [all commands](../commands.md)
