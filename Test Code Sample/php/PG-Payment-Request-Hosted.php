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
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2TLS,
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
		//save access token till expiry
            return $authenticateData->AccessToken;
        } else {
            return false;
        }
        
		
		}

	
	  function request($amount, $trackid, $reference, $udf1 = '', $udf2 = '', $udf3 = '', $udf4 = '', $udf5 = '',  $paymentType = 1, $lang = 'en',$returl = 'https://www.mydomain.com/response.php') {
		$ClientId = "test_ClientId";
		$ClientSecret = "test_ClientSecret";
		$ENCRP_KEY = "test_ENCRP_KEY";
		$URL = "https://pgtest.cbk.com";
	 
        //get access token 
        if ($AccessToken = getAccessToken()) {
            //generate pg page 
            $formData = array(
                'tij_MerchantEncryptCode' => $ENCRP_KEY,
                'tij_MerchAuthKeyApi' => $AccessToken,
                'tij_MerchantPaymentLang' => $lang,
                'tij_MerchantPaymentAmount' => $amount,
                'tij_MerchantPaymentTrack' => $trackid,
                'tij_MerchantPaymentRef' => $reference,
                'tij_MerchantUdf1' => $udf1,
                'tij_MerchantUdf2' => $udf2,
				'tij_MerchantUdf3' => $udf3,
				'tij_MerchantUdf4' => $udf4,
				'tij_MerchantUdf5' => $udf5,
                'tij_MerchPayType' => $paymentType,
				'tij_MerchReturnUrl' => $returl
            );
            $url = $URL."/ePay/pg/epay?_v=" . $AccessToken;
            $form = "<form id='pgForm' method='post' action='$url' enctype='application/x-www-form-urlencoded'>";
            foreach ($formData as $k => $v) {
                $form .= "<input type='hidden' name='$k' value='$v'>";
            }
            $form .= "</form><div style='position: fixed;top: 50%;left: 50%;transform: translate(-50%, -50%;text-align:center'>Redirecting to PG ... <br> <b> DO NOT REFRESH</b></div><script type='text/javascript'>
    document.getElementById('pgForm').submit();
</script>";

            return $form;
        } else {
            return "Authentication Failed";
        }
    }

	echo request(1, uniqid(), "abc");

?>