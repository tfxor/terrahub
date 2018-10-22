# terrahub build

```
Usage: terrahub build [options]

terrahub@0.0.1 (built: 2018-04-07T19:15:39.787Z)
this command will build code used by terraform configuration (e.g. AWS Lambda, Google Functions)

Options:
  --format, -o     Log only the command result in one of the following formats: json, text
  --include, -i    List of components to include (comma separated values)
  --exclude, -x    List of components to exclude (comma separated values)
  --include-regex, -I    List of components to include (regex search)
  --exclude-regex, -X    List of components to exclude (regex search)
  --git-diff, -g   List of components to include (git diff)
  --var, -r      Variable(s) to be used by terraform
  --var-file, -l   Variable file(s) to be used by terraform
  --silent, -s     Runs the command silently (without any output)
  --env, -e      Workspace environment
  --help, -h     Show list of available commands
```

To use terrahub build command you need to add your code in component terrahub configuration file. You can use the following template:
```yaml
build:
  version: Version

  env:
    variables:
      TEST_VARIABLE: "Test Variable"
    parameter-store:
      LOGIN_PASSWORD: "Password"

  phases:
    install:
      commands:
        - command
        - command
        - ...
      finally:
        - command
    pre_build:
      commands:
        - command
      finally:
        - command
    build:
      commands:
        - command
      finally:
        - command
    post_build:
      commands:
        - command
      finally:
        - command
  artifacts:
    files:
        - file
        - file
        - ...
    discard-paths: yes/no
  cache:
    paths:
        - path
        - path
        - ...
```

For more details please visit [AWS CodeBuild User Guide](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)

## Return
Back to [all commands](../commands.md)
