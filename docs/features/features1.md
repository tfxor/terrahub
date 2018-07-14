# Feature #1

## Make it easier and faster to create reusable terraform code
```
$ mkdir ./thub-demo && cd ./thub-demo

$ terrahub project -n "thub-demo"
✅ Project successfully initialized

$ ls -alR
total 8
drwxr-xr-x   4 eugene  staff   136 Apr 07 16:38 .
drwxr-xr-x  83 eugene  staff  2822 Apr 07 16:37 ..
-rw-r--r--   1 eugene  staff   112 Apr 07 16:37 .terrahub.yml

$ terrahub create -n "s3-bucket" -t s3
✅ Done

$ ls -alR
total 8
drwxr-xr-x   4 eugene  staff   136 Apr 07 16:38 .
drwxr-xr-x  83 eugene  staff  2822 Apr 07 16:37 ..
drwxr-xr-x   3 eugene  staff   102 Apr 07 16:38 .terrahub
-rw-r--r--   1 eugene  staff   112 Apr 07 16:37 .terrahub.yml

./.terrahub:
total 0
drwxr-xr-x  3 eugene  staff  102 Apr 07 16:38 .
drwxr-xr-x  4 eugene  staff  136 Apr 07 16:38 ..
drwxr-xr-x  9 eugene  staff  306 Apr 07 16:38 s3-bucket

./.terrahub/s3-bucket:
total 56
drwxr-xr-x  9 eugene  staff   306 Apr 07 16:38 .
drwxr-xr-x  3 eugene  staff   102 Apr 07 16:38 ..
-rw-r--r--  1 eugene  staff    18 Apr 07 16:38 .terrahub.yml
-rw-r--r--  1 eugene  staff  2195 Apr 07 16:38 README.md
-rw-r--r--  1 eugene  staff   998 Apr 07 16:38 default.tfvars
-rw-r--r--  1 eugene  staff   761 Apr 07 16:38 main.tf
-rw-r--r--  1 eugene  staff   422 Apr 07 16:38 output.tf
-rw-r--r--  1 eugene  staff   115 Apr 07 16:38 provider.tf
-rw-r--r--  1 eugene  staff  2318 Apr 07 16:38 variables.tf
```
