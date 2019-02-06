# component

Generation Terraform scripts from json
==================

Generation the bin file: 

```sh
$ cd $GOPATH/src/component
$ make linux | darwin | windows | all
```

Generation the templates

```sh
$ cd $GOPATH/src/component/../[YOUR OS ARCHITECTURE]/
$ geerator [provider name] [destination path like ./templates/]
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
