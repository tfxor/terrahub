package terraform

import (
  "fmt"
  "io/ioutil"
)

type ElementParam struct {
  element        map[string]interface{}
  elementType    string
  paramType      string
  isRequest      bool
  haveParent     int
  valName        string
  resurceType    string
  haveChild      bool
  haveParentList int
}

type GenerateYmlParam struct {
  filePath    string
  element     map[string]interface{}
  resurceType string
  existID     bool
  provider    string
}

type GenerateParam struct {
  element        map[string]interface{}
  resurceType    string
  elementType    string
  haveParent     int
  isRequest      bool
  haveParentList int
}

// GenerateYml - Generation yml file
func GenerateYml(param GenerateYmlParam) bool {
  paramRequests := ""
  paramOptionals := ""
  paramVariables := ""
  paramOutputs := ""
  pReqInt, pOptInt, pVarInt, pOutInt := GenerateParameters(
    GenerateParam{param.element, param.resurceType, "", 1, false, 0})
  paramRequests += pReqInt
  paramOptionals += pOptInt
  paramVariables += pVarInt
  paramOutputs += pOutInt

  templateYml := "  template:\n" +
    "    # terraform:\n" +
    "    #   backend:\n"
  switch param.provider {
  case "google":
    templateYml += "    #     bucket: 'tf-state-prod'\n" +
      "    #     prefix: 'terraform/state'\n"
  case "aws":
    templateYml += "    #     s3:\n" +
      "    #     key: 'path/to/terraform.tfstate'\n"
  case "azurerm":
    templateYml += "    #     storage_account_name: 'abcd1234'\n" +
      "    #     container_name: 'tfstate'\n" +
      "    #     key: 'prod.terraform.tfstate'\n"
  }
  templateYml += "    resource:\n" +
    "      " + param.resurceType + ":\n" +
    "        {{ name }}:\n"
  if paramRequests != "" {
    templateYml += paramRequests
  }
  if paramOptionals != "" {
    templateYml += paramOptionals
  }
  if paramVariables != "" {
    templateYml += "    variable:\n" + paramVariables
  }
  if paramOutputs != "" || param.existID {
    templateYml += "    output:\n"
    if param.existID {
      templateYml += "      id:\n" +
        "        value: '${" + param.resurceType + ".{{ name }}.id}'\n"
      templateYml += "      thub_id:\n" +
        "        value: '${" + param.resurceType + ".{{ name }}.id}'\n"
    }
    templateYml += paramOutputs
  }
  ioutil.WriteFile(param.filePath, []byte(templateYml), 0777)
  return true
}

// GenerateParameters - Parsing recursive json
func GenerateParameters(param GenerateParam) (string, string, string, string) {
  paramRequests, paramOptionals, paramVariables, paramOutputs := "", "", "", ""
  for k, v := range param.element {
    switch v.(type) {
    case map[string]interface{}:
      paramType := "string"
      element := param.element[k].(map[string]interface{})
      if element["Type"] != nil {
        paramType = element["Type"].(string)
      }
      haveChild := element["Elem"] != nil
      haveParentList := SerVarHaveParentList(param.elementType, param.haveParentList)
      parsingParam := ElementParam{
        element, param.elementType, paramType, param.isRequest,
        param.haveParent, k, param.resurceType, haveChild, haveParentList}
      pReqInt, pVarInt := ParsingRequestElement(parsingParam)
      paramRequests += pReqInt
      paramVariables += pVarInt
      paramOptionals += ParsingOptionalElement(parsingParam)
      if param.haveParent == 1 && element["Computed"] != nil {
        paramOutputs += "      " + k + ":\n" +
          "        value: '${" + param.resurceType + ".{{ name }}." + k + "}'\n"
      }
    }
  }
  return paramRequests, paramOptionals, paramVariables, paramOutputs
}

func SerVarHaveParentList(elementType string, haveParentList int) int {
  if elementType == "list" {
    return haveParentList + 1
  }
  return 0
}

// ParsingOptionalElement - Parsing optional element
func ParsingOptionalElement(param ElementParam) string {
  paramOptionals := ""
  if param.element["Optional"] == nil {
    return paramOptionals
  }
  param.isRequest = false
  param.element["Elem"] = CheckIfHasChild(param.element["Elem"])
  if param.haveParent == 1 {
    paramOptionals += "          # " + param.valName + ": "
    param.haveChild = param.element["Elem"] != nil
    paramOptionals += ParsingElementByType(param)
  } else {
    param.element["Elem"] = CheckIfHasChild(param.element["Elem"])
    paramOptionals += ParsingElementByType(param)
  }
  if param.element["Elem"] == nil {
    return paramOptionals
  }
  switch param.element["Elem"].(type) {
  case map[string]interface{}:
    pReqInt, pOptInt, _, _ := GenerateParameters(
      GenerateParam{
        param.element["Elem"].(map[string]interface{}),
        param.resurceType, param.paramType, param.haveParent + 1,
        param.isRequest, param.haveParentList})
    paramOptionals += pReqInt
    paramOptionals += pOptInt
  }
  return paramOptionals
}

// CheckIfHasChild - check if it has real child
func CheckIfHasChild(element interface{}) interface{} {
  str := fmt.Sprintf("%v", element)
  if str == "map[Type:string]" || str == "map[Type:set]" {
    return nil
  }
  return element
}

// ParsingRequestElement - Parsing request element
func ParsingRequestElement(param ElementParam) (string, string) {
  paramRequests := ""
  paramVariables := ""
  param.element["Elem"] = CheckIfHasChild(param.element["Elem"])
  param.haveChild = param.element["Elem"] != nil
  if param.element["Required"] == nil {
    return paramRequests, paramVariables
  }
  if param.haveParent == 1 && param.element["Elem"] == nil {
    param.isRequest = true
    paramRequests += "          " + param.valName + ": '${var.{{ name }}_" +
      param.valName + "}'\n"
    paramVariables += "      {{ name }}_" + param.valName + ":\n" +
      "        type: '" + param.paramType + "'\n"
  } else if param.haveParent == 1 && param.element["Elem"] != nil {
    param.isRequest = true
    paramRequests += "          " + param.valName + ": " + ParsingElementByType(param)
  } else {
    paramRequests += ParsingElementByType(param)
  }
  if param.element["Elem"] != nil {
    pReqInt, pOptInt, _, _ := GenerateParameters(
      GenerateParam{
        param.element["Elem"].(map[string]interface{}),
        param.resurceType, param.paramType, param.haveParent + 1,
        param.isRequest, param.haveParentList})
    paramRequests += pReqInt
    paramRequests += pOptInt
  }
  return paramRequests, paramVariables
}

// ParsingElementByType - Parsing element by type
func ParsingElementByType(param ElementParam) string {
  paramProc := ""
  startWith := ""
  if param.elementType == "list" {
    for j := 1; j <= param.haveParentList; j++ {
      startWith += "  "
    }
  }
  switch param.elementType {
  case "list":
    paramProc = SetSpaces(param.isRequest)
    startWith += param.valName + ": "
  case "map":
    paramProc = SetSpaces(param.isRequest)
    startWith += "'" + param.valName + "': "
  case "set":
    paramProc = SetSpaces(param.isRequest)
    startWith += param.valName + ": "
  }
  for j := 2; j <= param.haveParent; j++ {
    paramProc += "  "
  }
  paramProc += startWith +
    ReturnDefaultValueByType(param)
  return paramProc
}

func SetSpaces(isRequest bool) string {
  if !isRequest {
    return "          # "
  } else {
    return "          "
  }
}

// ReturnDefaultValueByType - Return default value by type
func ReturnDefaultValueByType(param ElementParam) string {
  defaultValueElem := "\n          "
  defaultValue := ""
  startWith := ""
  if !param.isRequest {
    defaultValueElem = "\n          # "
  }
  if param.elementType == "list" {
    for j := 2; j <= param.haveParent; j++ {
      startWith += "  "
    }
  }
  switch param.paramType {
  case "set":
    defaultValue += ParsingDefaultValue(defaultValue, param.haveChild,
      "[]\n", "\n")
  case "list":
    for j := 2; j <= param.haveParent; j++ {
      defaultValueElem += "  "
    }
    defaultValue += ParsingDefaultValue(defaultValue, param.haveChild,
      "[]\n", defaultValueElem+startWith+"  -\n")
  case "map":
    for j := 2; j <= param.haveParent; j++ {
      defaultValueElem += "  "
    }
    defaultValue += defaultValueElem + startWith + "  '[TO_BE_REPLACED]': ''\n"
  case "bool":
    defaultValue = "false\n"
  case "int":
    defaultValue = "0\n"
  case "string":
    defaultValue = "''\n"
  default:
    defaultValue = "''\n"
  }
  return defaultValue
}

// ParsingDefaultValue - parsing default value
func ParsingDefaultValue(defaultValue string, haveChild bool, valueHave string, valueDoNotHave string) string {
  if !haveChild {
    defaultValue += valueHave
  } else {
    defaultValue += valueDoNotHave
  }
  return defaultValue
}
