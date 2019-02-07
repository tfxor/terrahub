# generator

Generation TerraHub Templates from Terraform-providers
==================

Generation the bin file: 

```sh
$ cd $GOPATH/src/generator
$ make linux | darwin | windows | all
```

Generation the templates

```sh
$ cd $GOPATH/src/generator/../[YOUR OS ARCHITECTURE]/
$ generator [provider name] [destination path like ./templates/]
```

## Install Linux

Here's how it could look for 64 bits Linux, if you wanted `generator` available globally:

```bash
cd $GOPATH/src/generator/../linux_amd64/ && \
sudo cp generator /usr/local/bin && \
sudo chmod 755 /usr/local/bin/generator && generator -version
```

## Install OSX

Here's how it could look for 64 bits Darwin, if you wanted `generator` available globally:

```bash
cd $GOPATH/src/generator/../darwin_amd64/ && \
sudo cp generator /usr/local/bin && \
sudo chmod 755 /usr/local/bin/generator && generator -version
```
