# Example

1. terrahub project -n HelloWorld -d ~/hello-world && cd ~/hello-world/
2. terrahub create -t iam -n DeepProdHelloWorldLambdaExec1234abcd
3. terrahub create -t iam -n DeepProdHelloWorldApiExec1234abcd
4. terrahub create -t s3 -n DeepProdPrivate1234abcd
5. terrahub create -t s3-website -n DeepProdPublic1234abcd
6. terrahub create -t cf -n DeepProdCdn1234abcd -P DeepProdPublic1234abcd
7. terrahub create -t lambda -n DeepProdSayHelloCreateDb -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateDb.zip
8. terrahub create -t lambda -n DeepProdSayHelloCreateFs -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateFs.zip
9. terrahub create -t lambda -n DeepProdSayHelloCreateMsg -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateMsg.zip
10. terrahub create -t api -n DeepProdApi1234abcd -P DeepProdHelloWorldApiExec1234abcd
11. terrahub create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateDb -P DeepProdSayHelloCreateDb
12. terrahub create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateFs -P DeepProdSayHelloCreateFs
13. terrahub create -t api-gateway-resource -n DeepHelloWorldSayHelloCreateMsg -P DeepProdSayHelloCreateMsg
14. terrahub create -t dynamo -n DeepProdName1234abcd
15. terrahub run
16. terrahub list
