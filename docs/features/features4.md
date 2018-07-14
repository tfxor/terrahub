# Feature #4

## Integrate and manage any existing terraform code
```
$ cd ./security-terraform

$ ls -alR
total 56
drwxr-xr-x   7 eugene  staff    238 Apr 07 18:22 .
drwxr-xr-x  84 eugene  staff   2856 Apr 07 18:21 ..
-rw-r--r--@  1 eugene  staff  15896 Apr 04 12:47 LICENSE
-rw-r--r--   1 eugene  staff     20 Apr 04 14:20 README.md
drwxr-xr-x   9 eugene  staff    306 Apr 07 18:24 iam
-rw-r--r--   1 eugene  staff   3997 Apr 07 11:15 provider.def.tf
-rw-r--r--   1 eugene  staff   2895 Apr 07 10:06 provider.vars.tf

./iam:
total 32
drwxr-xr-x   9 eugene  staff   306 Apr 07 18:24 .
drwxr-xr-x   7 eugene  staff   238 Apr 07 18:22 ..
-rw-r--r--   1 eugene  staff   195 Apr 07 21:01 config.tf
-rw-r--r--   1 eugene  staff    50 Apr 07 21:27 default.tfvars
-rw-r--r--   1 eugene  staff  3877 Apr 07 09:32 main.tf
lrwxr-xr-x   1 eugene  staff    21 Apr 07 21:31 provider.def.tf -> ../../provider.def.tf
lrwxr-xr-x   1 eugene  staff    22 Apr 07 21:31 provider.vars.tf -> ../../provider.vars.tf
-rw-r--r--   1 eugene  staff    30 Apr 07 21:27 variables.tf

$ terrahub project -n "Security_Terraform"
✅ Project successfully initialized

$ terrahub component -n "iam" -d iam/
✅ Done

$ ls -alR
total 64
drwxr-xr-x   8 eugene  staff    272 Apr 07 18:29 .
drwxr-xr-x  84 eugene  staff   2856 Apr 07 18:21 ..
-rw-r--r--   1 eugene  staff    121 Apr 07 18:29 .terrahub.yml
-rw-r--r--@  1 eugene  staff  15896 Apr 04 12:47 LICENSE
-rw-r--r--   1 eugene  staff     20 Apr 04 14:20 README.md
drwxr-xr-x   9 eugene  staff    306 Apr 07 18:30 iam
-rw-r--r--   1 eugene  staff   3997 Apr 07 11:15 provider.def.tf
-rw-r--r--   1 eugene  staff   2895 Apr 07 10:06 provider.vars.tf

./iam:
total 40
drwxr-xr-x  9 eugene  staff   306 Apr 07 18:30 .
drwxr-xr-x  8 eugene  staff   272 Apr 07 18:29 ..
-rw-r--r--  1 eugene  staff    10 Apr 07 18:29 .terrahub.yml
-rw-r--r--  1 eugene  staff   195 Apr 07 21:01 config.tf
-rw-r--r--  1 eugene  staff    50 Apr 07 21:27 default.tfvars
-rw-r--r--  1 eugene  staff  3877 Apr 07 09:32 main.tf
lrwxr-xr-x  1 eugene  staff    21 Apr 07 21:31 provider.def.tf -> ../../provider.def.tf
lrwxr-xr-x  1 eugene  staff    22 Apr 07 21:31 provider.vars.tf -> ../../provider.vars.tf
-rw-r--r--  1 eugene  staff    30 Apr 07 21:27 variables.tf
```

Back to [all features](../features.md)
