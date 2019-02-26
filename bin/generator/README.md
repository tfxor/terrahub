# generator

Generation TerraHub Templates from Terraform-providers
==================

Generate the bin file:

```sh
$ cd $GOPATH/src/generator
$ make linux | darwin | windows | all
```

Generate the terrahub templates

```sh
$ cd $GOPATH/src/generator/../[YOUR OS ARCHITECTURE]/
$ generator [provider_name] [path_to_output_templates]
```

Compress terraform configurations into terrahub config

```sh
$ cd $GOPATH/src/generator/../[YOUR OS ARCHITECTURE]/
$ generator -toyml [-recursively] [path_to_input_hcl] [path_to_output_config]
```

Compress terraform configurations into terrahub config
Scanning all children directories

```sh
$ cd $GOPATH/src/generator/../[YOUR OS ARCHITECTURE]/
$ generator -thub [-recursively] [path_to_input_hcl_parent_folder] [path_to_output_config_parent_folder] [everoment] 
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
