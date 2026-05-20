using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace CBK_Payment_Gateway
{
    public partial class PG_Payment_Result_Hosted : System.Web.UI.Page
    {

        public string ClientId = "test_ClientId";
        public string ClientSecret = "test_ClientSecret";
        public string ENCRP_KEY = "test_ENCRP_KEY";

        public class AuthToken
        {
            public string AccessToken { get; set; }
            public string Status { get; set; }

        }

        public class TransactionDataConfirm
        {
            public string TrackId { get; set; }
            public string ENCRP_KEY { get; set; }
            public string AccessToken { get; set; }
        }

        public class ResponseMessageModel
        {
            public string Status { get; set; }
            public string Message { get; set; }
        }

        public class AuthSettings
        {
            public string Url { get; set; }
            public string ClientId { get; set; }
            public string ClientSecret { get; set; }
            public string ENCRP_KEY { get; set; }
        }

        public class TransactionResult
        {
            public string Status { get; set; }
            public string Amount { get; set; }
            public string TrackId { get; set; }
            public string PayType { get; set; }
            public string PaymentId { get; set; }
            public string ReceiptNo { get; set; }
            public string AuthCode { get; set; }
            public string PostDate { get; set; }
            public string ReferenceId { get; set; }
            public string TransactionId { get; set; }
            public string Message { get; set; }
            public string PayId { get; set; }
            public string MerchUdf1 { get; set; }
            public string MerchUdf2 { get; set; }
            public string MerchUdf3 { get; set; }
            public string CCMessage { get; set; }
            public string MerchUdf4 { get; set; }
            public string MerchUdf5 { get; set; }
        }
       

        protected void Page_Load(object sender, EventArgs e)
        {
            AuthSettings cBKAuthSettings = new AuthSettings
            {
                Url = "https://pgtest.cbk.com/ePay/api/cbk/online/pg/merchant/Authenticate",
                ClientId = ClientId,
                ClientSecret = ClientSecret,
                ENCRP_KEY = ENCRP_KEY
            };

            AuthToken cBKAuthToken = _download_serialized_object_data(cBKAuthSettings);

            var url = "https://pgtest.cbk.com/ePay/api/cbk/online/pg/GetTransactions/" + Request.QueryString["encrp"] + "/" + cBKAuthToken.AccessToken;

            var transactionResult = _download_serialized_json_data<TransactionResult>(url, cBKAuthSettings);

            Response.Write(JsonConvert.SerializeObject(transactionResult));
        }

        private AuthToken _download_serialized_object_data(AuthSettings cBKAuthSettings)
        {
            var dataString = string.Empty;
            var tokenResult = new AuthToken();
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            using (var client = new WebClient())
            {
                dataString = JsonConvert.SerializeObject(cBKAuthSettings);
                client.Headers.Add(HttpRequestHeader.ContentType, "application/json");

                var ClientId = cBKAuthSettings.ClientId;
                var ClientSecret = cBKAuthSettings.ClientSecret;
                var ClientMerch = cBKAuthSettings.ENCRP_KEY;

                var authHeader = Convert.ToBase64String(Encoding.Default.GetBytes($"{ClientId}:{ClientSecret}"));
                client.Headers[HttpRequestHeader.Authorization] = string.Format("Basic {0}", authHeader);
                try
                {
                    string cBKAuthToken = client.UploadString(new Uri(cBKAuthSettings.Url), "POST", dataString);
                    tokenResult = JsonConvert.DeserializeObject<AuthToken>(cBKAuthToken);
                }
                catch (WebException ex)
                {
                    string exep = ex.Message;
                    tokenResult.Status = ex.ToString();
                    //save exception to log
                }
                catch (Exception ex)
                {
                    string exep = ex.Message;
                    tokenResult.Status = ex.ToString(); ;
                }


            }
            return tokenResult;
        }

        private TransactionResult _download_serialized_json_data<TransactionResult>(string url, AuthSettings cBKAuthSettings) where TransactionResult : new()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            using (var w = new WebClient())
            {
                var json_data = string.Empty;

                w.Headers.Add(HttpRequestHeader.ContentType, "application/json");

                var ClientId = cBKAuthSettings.ClientId;
                var ClientSecret = cBKAuthSettings.ClientSecret;
                var ClientMerch = cBKAuthSettings.ENCRP_KEY;

                var authHeader = Convert.ToBase64String(Encoding.Default.GetBytes($"{ClientId}:{ClientSecret}"));
                w.Headers[HttpRequestHeader.Authorization] = string.Format("Basic {0}", authHeader);

                try
                {
                    json_data = w.DownloadString(url);
                }
                catch (WebException ex)
                {
                    string exep = ex.Message;
                }
                catch (Exception ex)
                {
                    string exep = ex.Message;
                }
                return !string.IsNullOrEmpty(json_data) ? JsonConvert.DeserializeObject<TransactionResult>(json_data) : new TransactionResult();
            }
        }
    }
}