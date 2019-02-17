# component

Generate HCL version of terraform configuration

```sh
$ cd $GOPATH/src/component
$ make linux | darwin | windows | all
```

Generation the templates

```sh
$ cd $GOPATH/src/component/../[YOUR OS ARCHITECTURE]/
$ component [path_to_input_json] [path_to_output_hcl] [component_name]
```

## Install Linux

Here's how it could look for 64 bits Linux, if you wanted `component` available globally:

```bash
cd $GOPATH/src/component/../linux_amd64/ && \
sudo cp component /usr/local/bin && \
sudo chmod 755 /usr/local/bin/component && component -version
```

## Install OSX

Here's how it could look for 64 bits Darwin, if you wanted `component` available globally:

```bash
cd $GOPATH/src/component/../darwin_amd64/ && \
sudo cp component /usr/local/bin && \
sudo chmod 755 /usr/local/bin/component && component -version
```
