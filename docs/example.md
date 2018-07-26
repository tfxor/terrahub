# Example

1. terrahub project -n HelloWorld -d ~/hello-world && cd ~/hello-world/
2. terrahub component -n DeepProdHelloWorldLambdaExec1234abcd -t aws_iam_role
3. terrahub component -n DeepProdHelloWorldApiExec1234abcd -t aws_iam_role
4. terrahub component -n DeepProdPrivate1234abcd -t aws_s3_bucket
5. terrahub component -n DeepProdPublic1234abcd -t aws_s3_website
6. terrahub component -n DeepProdCdn1234abcd -t aws_cloudfront_distribution -P DeepProdPublic1234abcd
7. terrahub component -n DeepProdSayHelloCreateDb -t aws_lambda_function -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateDb.zip
8. terrahub component -n DeepProdSayHelloCreateFs -t aws_lambda_function -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateFs.zip
9. terrahub component -n DeepProdSayHelloCreateMsg -t aws_lambda_function -P DeepProdHelloWorldLambdaExec1234abcd -s s3://deep-prod-private-1234abcd/SayHelloCreateMsg.zip
10. terrahub component -n DeepProdApi1234abcd -t aws_api_gateway_rest_api -P DeepProdHelloWorldApiExec1234abcd
11. terrahub component -n DeepHelloWorldSayHelloCreateDb -t aws_api_gateway_resource -P DeepProdSayHelloCreateDb
12. terrahub component -n DeepHelloWorldSayHelloCreateFs -t aws_api_gateway_resource -P DeepProdSayHelloCreateFs
13. terrahub component -n DeepHelloWorldSayHelloCreateMsg -t aws_api_gateway_resource -P DeepProdSayHelloCreateMsg
14. terrahub component -n DeepProdName1234abcd -t aws_dynamodb_table
15. terrahub run
16. terrahub list


## Return
Back to [readme](readme.md)
