package cycoreutils

var nlsMessages = []byte(`{
	"SUSRPARM001E": {
		"code": "SUSRPARM001E",
		"status": "ERROR",
		"description": "Incorrect number of arguments"
	},
	"SUKNCONV001E": {
		"code": "SUKNCONV001E",
		"status": "ERROR",
		"description": "Unknown Object type"
	},
	"SASTCONV002E": {
		"code": "SASTCONV002E",
		"status": "ERROR",
		"description": "Unable to convert JSON parameter to Object"
	},
	"SASTQRY003E": {
		"code": "SASTQRY003E",
		"status": "ERROR",
		"description": "Unable to query the Object"
	},
	"SASTDNE004E": {
		"code": "SASTDNE004E",
		"status": "ERROR",
		"description": "Referenced Object does not exist"
	},
	"SASTQRY005S": {
		"code": "SASTQRY005S",
		"status": "SUCCESS",
		"description": "Successfully queried Object details"
	},
	"SASTQRY006E": {
		"code": "SASTQRY006E",
		"status": "ERROR",
		"description": "Unable to query the Object List"
	},
	"SASTQRY007S": {
		"code": "SASTQRY007S",
		"status": "SUCCESS",
		"description": "Successfully queried Object List"
	},
	"SASTQRY008E": {
		"code": "SASTQRY008E",
		"status": "ERROR",
		"description": "Object record already exists"
	},
	"SASTUPD009E": {
		"code": "SASTUPD009E",
		"status": "ERROR",
		"description": "Object update failed"
	},
	"SASTUPD010S": {
		"code": "SASTUPD010S",
		"status": "SUCCESS",
		"description": "Successfully updated Object info"
	},
	"SASTREC011S": {
		"code": "SASTREC011S",
		"status": "SUCCESS",
		"description": "Successfully recorded Object info"
	},
	"SASTDEL012E": {
		"code": "SASTDEL012E",
		"status": "ERROR",
		"description": "Object record delete failed"
	},
	"SASTDEL013I": {
		"code": "SASTDEL013I",
		"status": "SUCCESS",
		"description": "Successfully deleted Object from ledger"
	  },
	"SASTQRY014S": {
		"code": "SASTQRY014S",
		"status": "SUCCESS",
		"description": "Successfully queried Object History"
	},


	"CYUSRPARM001E": {
		"code": "CYUSRPARM001E",
		"status": "ERROR",
		"description": "Incorrect number of arguments"
	},
	"CYUSRCONV002E": {
		"code": "CYUSRCONV002E",
		"status": "ERROR",
		"description": "Unable to convert JSON parameter to User object"
	},
	"CYUSRQRY003E": {
		"code": "CYUSRQRY003E",
		"status": "ERROR",
		"description": "Unable to query user"
	},
	"CYUSRDNE004E": {
		"code": "CYUSRDNE004E",
		"status": "ERROR",
		"description": "User does not exist"
	},
	"CYUSRQRY006S": {
		"code": "CYUSRQRY006S",
		"status": "SUCCESS",
		"description": "Successfully queried user request list"
	},
	"CYUSRUPD007E": {
		"code": "CYUSRUPD007E",
		"status": "ERROR",
		"description": "User object update failed"
	},
	"CYUSRRURI008S": {
		"code": "CYUSRRURI008S",
		"status": "SUCCESS",
		"description": "Successfully recorded user request info"
	},
	"CYUSRCNF009E": {
		"code": "CYUSRCNF009E",
		"status": "ERROR",
		"description": "User request code not found"
	},
	"CYUSRQUR010S": {
		"code": "CYUSRQUR010S",
		"status": "SUCCESS",
		"description": "Successfully queried user request info"
	},
	"CYUSRDNE011E": {
		"code": "CYUSRDNE011E",
		"status": "ERROR",
		"description": "User request does not exist"
	},
	"CYUSRTDNE011E": {
		"code": "CYUSRTDNE011E",
		"status": "ERROR",
		"description": "User already exist"
	},
	"CYUSRQRY012E": {
		"code": "CYUSRQRY012E",
		"status": "ERROR",
		"description": "Unable to query user request"
	},
	"CYUSRREC013S": {
		"code": "CYUSRREC013S",
		"status": "SUCCESS",
		"description": "Successfully recorded user"
	},
	"CYUSRQRY014S": {
		"code": "CYUSRQRY014S",
		"status": "SUCCESS",
		"description": "Successfully queried user(s)"
	},
	"CYUSRUPD015S": {
		"code": "CYUSRUPD015S",
		"status": "SUCCESS",
		"description": "Successfully updated user info"
	},
	"CYUSRCONV016E": {
		"code": "CYUSRCONV016E",
		"status": "ERROR",
		"description": "Unable to convert JSON parameter to role actions object"
	},
	"CYUSRUPD017E": {
		"code": "CYUSRUPD017E",
		"status": "ERROR",
		"description": "Error inserting role actions object into LedgerState"
	},
	"CYUSRRRA018S": {
		"code": "CYUSRRRA018S",
		"status": "SUCCESS",
		"description": "Successfully recorded role actions"
	},
	"CYUSRQRY019E": {
		"code": "CYUSRQRY019E",
		"status": "ERROR",
		"description": "Unable to query role actions"
	},
	"CYUSRDNE020E": {
		"code": "CYUSRDNE020E",
		"status": "ERROR",
		"description": "Role actions not found"
	},
	"CYUSRQRY021S": {
		"code": "CYUSRQRY021S",
		"status": "SUCCESS",
		"description": "Successfully queried role actions"
	},
	"CYUSRUPE022E": {
		"code": "CYUSRUPE022E",
		"status": "ERROR",
		"description": "User does not have permission "
	},
	"CYUSRCONV023E": {
		"code": "CYUSRCONV023E",
		"status": "ERROR",
		"description": "Unable to convert JSON paramter to use request"
	},
	"CYUSRQRY024E": {
		"code": "CYUSRQRY024E",
		"status": "ERROR",
		"description": "Unable to query user(s)"
	},
	
	
	
	

	"CYAPPCPARM001E": {
		"code": "CYAPPCPARM001E",
		"status": "ERROR",
		"description": "Incorrect number of arguments"
	},
	"CYAPPC002E": {
		"code": "CYAPPC002E",
		"status": "ERROR",
		"description": "failed to create config"
	},
	"CYAPPC001S":{
		"code": "CYAPPC001S",
		"status": "SUCCESS",
		"description": "Successfully created configuration"
	},
	"CYAPPC003E":{
		"code": "CYAPPC003E",
		"status": "ERROR",
		"description": "Error querying configuration"
	},
	"CYAPPC004S":{
		"code": "CYAPPC004S",
		"status": "SUCCESS",
		"description": "Sucessfully queried configuration"
	},



	"CYDOCPARM001E":{
		"code": "CYDOCPARM001E",
		"status": "ERROR",
		"description": "No Document parameter found"
	},
	"CYDOCCONV002E": {
		"code": "CYDOCCONV002E",
		"status": "ERROR",
		"description": "Unable to convert JSON parameter to Document"
	},
	"CYDOCCONV003E":{
		"code":"CYDOCCONV003E",
		"status":"ERROR",
		"description":"Unable to convert document to JSON parameter"
	},
	"CYDOCQRY004E": {
		"code": "CYDOCQRY004E",
		"status": "ERROR",
		"description": "Unable to query Document from ledger"
	},
	"CYDOCAE005E": {
		"code":"CYDOCAE005E",
		"status":"ERROR",
		"description":"Document already exists"
	},
	"CYDOCUPD006E": {
		"code": "CYDOCUPD006E",
		"status": "ERROR",
		"description": "Unable to update Document into Ledger"
	},
	"CYDOCREG007I": {
		"code": "CYDOCREG007I",
		"status": "SUCCESS",
		"description": "SUCCESSfully registered Document into Ledger"
	},
	"CYDOCKNE008E":{
		"code":"CYDOCKNE008E",
		"status":"ERROR",
		"description":"Keys for document do not exist"
	},
	"CYDOCDNE009E": {
		"code": "CYDOCDNE009E",
		"status": "ERROR",
		"description": "Document does not exist"
	},
	"CYDOCUPD010I": {
		"code": "CYDOCUPD010I",
		"status": "SUCCESS",
		"description": "Successfully updated document into ledger"
	},
	"CYDOCDEL011E": {
		"code": "CYDOCDEL011E",
		"status": "ERROR",
		"description": "Unable to delete document from ledger"
	},
	"CYDOCDEL012I": {
		"code": "CYDOCDEL012I",
		"status": "SUCCESS",
		"description": "Successfully deleted document from ledger"
	},
	"CYDOCQRY013I": {
		"code": "CYDOCQRY013I",
		"status": "SUCCESS",
		"description": "Successfully queried document from ledger"
	},
	"CYDOCHSH014I": {
		"code": "CYDOCHSH014I",
		"status": "SUCCESS",
		"description": "Empty Hash Value"
	},




	"CYASTARG001E":{
			"code": "CYASTARG001E",
			"status": "ERROR",
			"description": "Incorrect number of arguments"
	},
	"CYASTJSON002E": {
		"code": "CYASTJSON002E",
		"status": "ERROR",
		"description": "Unable to convert JSON parameter to object"
	},
	"CYASTQRY003E": {
		"code": "CYASTQRY003E",
		"status": "ERROR",
		"description": "Unable to query asset from ledger"
	},
	"CYASTZRB004S": {
		"code": "CYASTZRB004S",
		"status": "SUCCESS",
		"description": "Successfully queried the ledger, but retrieved zero bytes"
	},
	"CYASTUPD005S": {
		"code": "CYASTUPD005S",
		"status": "SUCCESS",
		"description": "Successfully updated asset into the ledger"
	},
	"CYASTUPD006E": {
		"code": "CYASTUPD006E",
		"status": "ERROR",
		"description": "Error updating asset into the ledger"
	},
	"CYASTQRY007S": {
		"code": "CYASTQRY007S",
		"status": "SUCCESS",
		"description": "Successfully queried asset from the ledger"
	},
	"CYASTAE008E": {
		"code": "CYASTAE008E",
		"status": "ERROR",
		"description": "Asset with the given ID already exists"
	},
	"CYASTDE009E" :{
		"code": "CYASTDE009E",
		"status": "ERROR",
		"description": "Asset with the given ID does not exist"
	},
	"CYASTDEL010E" :{
		"code": "CYASTDEL010E",
		"status": "ERROR",
		"description": "Unable to delete asset with given ID"
	},
	"CYASTDEL011S" :{
		"code": "CYASTDEL011S",
		"status": "SUCCESS",
		"description": "Successfully deleted asset with given ID"
	},			
	"CYHASHERR001E" : {
		"code": "CYHASHERR001E",
		"status": "ERROR",
		"description": "Hash comparison has not been successful"
	}
}`)
