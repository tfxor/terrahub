# Publish on Homebrew

Fork from https://github.com/Homebrew/homebrew-core
into https://github.com/tfxor/homebrew-core

```shell
git clone https://github.com/tfxor/homebrew-core.git
```

```
cd homebrew-core
git remote add upstream https://github.com/Homebrew/homebrew-core.git
```

```shell
# every time you need to update
git fetch upstream
```

```shell
brew create https://github.com/tfxor/terrahub/archive/v0.2.8.tar.gz
```

```shell
brew audit --new-formula terrahub
```

```shell
git commit -a -m "add new formula"
```

```
https://github.com/tfxor/homebrew-core/blob/master/Formula/terrahub.rb
```
