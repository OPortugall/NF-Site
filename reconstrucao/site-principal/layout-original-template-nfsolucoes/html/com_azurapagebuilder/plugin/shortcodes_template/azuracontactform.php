<?php 
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
defined('_JEXEC') or die;
$col_class = 'grid-half';
if($showwebsite == '1'){
	$col_class = 'grid-2';
}
?>
<!--contact form -->
								
<div class="contactForm clear">
	<fieldset >											
	<form id="contact_form" method="post" action="index.php" enctype="multipart/form-data">			
		<div class="<?php echo $col_class;?>">
			<label for="name"><?php echo JText::_('COM_AZURAPAGEBUILDER_CONTACT_NAME_TEXT');?></label>
			<input type="text" name="name" id="name" />
		</div>

		<?php if($showwebsite == '1') : ?>
		<div class="<?php echo $col_class;?>">
			<label for="website"><?php echo JText::_('COM_AZURAPAGEBUILDER_CONTACT_WEBSITE_TEXT');?></label>
			<input type="text" name="website" id="website" />
		</div>
		<?php endif;?>
				
		<div class="<?php echo $col_class;?>">
			<label for="email" class="em"><?php echo JText::_('COM_AZURAPAGEBUILDER_CONTACT_EMAIL_TEXT');?></label>
			<input type="text" name="email" id="email"  class="right" />
		</div>
				
		<label for="message" class="m-top"><?php echo JText::_('COM_AZURAPAGEBUILDER_CONTACT_MESSAGE_TEXT');?></label>
		<textarea name="message"  id="message" ></textarea>
				
		<div class="clear"></div>
		<?php if($sendascopy == '1') :?>
			<label ><?php echo JText::_('MOD_AZURAPAGEBUILDER_SEND_AS_A_COPY_TEXT');?></label>
			<input type="checkbox" value="1" name="sendAsCopy">
		<div class="clear"></div>
		<?php endif;?>

											
		<label>
			<button class="submit_btn transition" id="submit_btn"><?php echo JText::_('COM_AZURAPAGEBUILDER_CONTACT_SEND_TEXT');?></button>
		</label>
		<input type="hidden" name="receiveEmail" value="<?php echo $receiveemail;?>">
		<input type="hidden" name="subject" value="<?php echo $emailsubject;?>">
		<input type="hidden" name="thanks" value="<?php echo $thanksmessage;?>">
		<input type="hidden" name="option" value="com_azurapagebuilder">
		<input type="hidden" name="task" value="contact.sendemail">
		<?php echo JHtml::_('form.token'); ?>
		<div id="result"></div>
		</form>
	</fieldset>
		
</div>		

<script type="text/javascript">
	//jQuery(document).ready(function($){
		// Subscribe   ----------------------------------------
	$ = jQuery.noConflict();

	$("#submit_btn").click(function(){	

		var user_name=$('input[name=name]').val();
		var user_email=$('input[name=email]').val();
		var user_message=$('textarea[name=message]').val();
		var proceed=true;
		if(user_name==""){
			$('input[name=name]').css('border','1px solid #F54F36');
			proceed=false
		}
		if(user_email==""){
			$('input[name=email]').css('border','1px solid #F54F36');
			proceed=false
		}
		if(user_message==""){
			$('textarea[name=message]').css('border','1px solid #F54F36');
			proceed=false
		}
		if(proceed){
			var action = $('#contact_form').attr('action');
			//post_data={'userName':user_name,'userEmail':user_email,'userMessage':user_message};
			$.post(
				action,
				//post_data,
				$('#contact_form').serialize(),
				function(data){
					$("#result").hide().html('<div class="success">'+data.msg+'</div>').slideDown(500);
					$('#contact_form input').val('');
					$('#contact_form textarea').val('')},

				'json'

			).fail(function(err){
					$("#result").hide().html('<div class="error">'+err.msg+'</div>').fadeIn(1500)
				}
			);
		}

		return false;
	});
	
	$("#contact_form input, #contact_form textarea").keyup(function(){		
		$("#contact_form input, #contact_form textarea").css('border','1px solid #101011');
		$("#result").fadeOut(1500)			
	});	
	//});
</script>
