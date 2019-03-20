# Publish on Debian

```shell
gpg --gen-key
```

```
https://launchpad.net/~terrahub
```

```shell
gpg --fingerprint hello@terrahub.io
```

```shell
gpg --list-secret-keys --keyid-format LONG
```

```shell
gpg --keyserver keyserver.ubuntu.com --send-keys [KEY_ID]
```

```
https://launchpad.net/~terrahub/+editpgpkeys
```

```
https://launchpad.net/~terrahub/+editsshkeys
```
