/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes */
'use strict';

window.l_show = function() {
  "use strict";
  $('.register-form').show(); $('.login-form, .social-buttons, .form-line').hide();
};

window.l_toggle = function() {
  "use strict";
  $('.message a').click(function() {
      $('form, .social-buttons, .form-line').animate({height: "toggle", opacity: "toggle"}, "slow");
  });
};
