# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "glue_classifier_name" {
  description = "The name of the classifier."
}

variable "glue_classifier_classification" {
  description = "An identifier of the data format that the classifier matches."
}

variable "glue_classifier_row_tag" {
  description = "The XML tag designating the element that contains each record in an XML document being parsed. Note that this cannot identify a self-closing element (closed by />). An empty row element that contains only attributes can be parsed as long as it ends with a closing tag (for example, <row item_a='A' item_b='B'></row> is okay, but <row item_a='A' item_b='B' /> is not)."
}
