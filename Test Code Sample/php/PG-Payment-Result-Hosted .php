<?php 
 	
	 function getAccessToken() {
	  
		$ClientId = "test_ClientId";
		$ClientSecret = "test_ClientSecret";
		$ENCRP_KEY = "test_ENCRP_KEY";
		$URL = "https://pgtest.cbk.com";
	 
		$postfield = array("ClientId" => $ClientId,
						   "ClientSecret" => $ClientSecret,
						   "ENCRP_KEY" => $ENCRP_KEY);
        
        $curl = curl_init();

		 curl_setopt_array($curl, array(
					CURLOPT_URL =>  $URL ."/ePay/api/cbk/online/pg/merchant/Authenticate",
					CURLOPT_ENCODING => "",
					CURLOPT_FOLLOWLOCATION => 1,
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_TIMEOUT => 30,
					CURLOPT_SSL_VERIFYHOST=>0,
					CURLOPT_SSL_VERIFYPEER=>0,
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
					CURLOPT_CUSTOMREQUEST => "POST",
					CURLOPT_RETURNTRANSFER => 1,
					CURLOPT_FRESH_CONNECT => true,
					CURLOPT_POSTFIELDS => json_encode($postfield),
					CURLOPT_HTTPHEADER => array(
						'Authorization: Basic ' . base64_encode($ClientId. ":" . $ClientSecret),
						"Content-Type: application/json",
						"cache-control: no-cache"
					),
				));

        $response = curl_exec($curl);
        $err = curl_error($curl);
        
        curl_close($curl);
  

    
        
        $authenticateData = json_decode($response);
            
        if ($authenticateData->Status == "1") {
            return $authenticateData->AccessToken;
        } else {
            return false;
        }
		}
	
 
 
    function response($encrp) {

		$ClientId = "test_ClientId";
		$ClientSecret = "test_ClientSecret";
		$ENCRP_KEY = "test_ENCRP_KEY";
		$URL = "https://pgtest.cbk.com";

        //returns the unencrypted data
        //get access token 
        if ($AccessToken = getAccessToken()) {
            $url = $URL."/ePay/api/cbk/online/pg/GetTransactions/" . $encrp . "/" . $AccessToken;
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $url,
                CURLOPT_ENCODING => "",
                CURLOPT_FOLLOWLOCATION => 1,
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => "GET",
                CURLOPT_RETURNTRANSFER => 1,
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Basic ' .base64_encode($ClientId. ":" . $ClientSecret),
                    "Content-Type: application/json",
                    "cache-control: no-cache"
                ),
            ));

            $response = curl_exec($curl);
            $err = curl_error($curl);
            curl_close($curl);

                
            $paymentDetails = json_decode($response);
			if($paymentDetails->Status != "0" or $paymentDetails->Status != "-1")
			{
				return $paymentDetails;
			}
            else {
				return false;
			 }

       
        } else {
            return false;
        }
    }


	$encrp = $_REQUEST['encrp'];

	var_dump(response($encrp));

?>