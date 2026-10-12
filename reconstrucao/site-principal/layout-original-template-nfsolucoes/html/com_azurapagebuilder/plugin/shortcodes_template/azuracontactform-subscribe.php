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

?>
<?php if(!empty($title)) : ?>
<h3 class="sections-head"><?php echo $title;?></h3>
<div class="small-separator ws"></div>
<?php if(!empty($introduction)) : ?>
	<p><?php echo $introduction;?></p>
<?php endif;?>
<div class="clear"></div>
<?php endif;?>
<div class="subcribe">
	<span class="overlay suboverlay"></span>
	<fieldset>
		<form class="subscriptionForm" id="subscriptionForm" method="post" action="index.php?option=com_azurapagebuilder&amp;task=contact.subscribe" enctype="multipart/form-data">
			<input  class="inputForm" type="text" name="e-mail" value="Digite seu Email" onFocus="if (this.value=='Digite seu Email') this.value=''" onBlur="if (this.value==''){this.value='Digite seu Email'}" />
			<?php if($sendascopy == '1') :?>
			<div>
				<label ><?php echo JText::_('MOD_AZURAPAGEBUILDER_SEND_AS_A_COPY_TEXT');?></label>
				<input type="checkbox" value="1" name="sendAsCopy">
			</div>
			<?php endif;?>
			<input type="submit" id="submitButton" class="transition" value="<?php echo JText::_('COM_AZURAPAGEBUILDER_CONTACT_SEND_TEXT');?>">
			<input type="hidden" name="receiveEmail" value="<?php echo $receiveemail;?>">
			<input type="hidden" name="subject" value="<?php echo $emailsubject;?>">
			<input type="hidden" name="thanks" value="<?php echo $thanksmessage;?>">
			<?php echo JHtml::_('form.token'); ?>
		</form>
		
		<div id="success"></div>
		<div id="error"></div>
		
	</fieldset>
</div> 

<script type="text/javascript">
	//jQuery(document).ready(function($){
		// Subscribe   ----------------------------------------
		$ = jQuery.noConflict();

		$('#subscriptionForm').submit(function(){	
			$.ajax({
				url:$('#subscriptionForm').attr('action'),
				type :'POST',
				dataType:'json',
				data: $('#subscriptionForm').serialize(),
				success: function(data){
					
					if(data.info == 'error'){
						$('#error').html(data.msg).fadeIn()
					}
					else{
						$('#success').html(data.msg).fadeIn();
						$("#error").html('').hide();
					}
				}
			});
			return false;
		});
		
		$('#subscriptionForm').focus(function(){
			$('#error').html('').fadeOut();
			$('#success').html('').fadeOut();	
		});
		
		$('#subscriptionForm').keydown(function(){	
			$('#error').html('').fadeOut();
			$('#success').html('').fadeOut();		
		});	 
	//});
</script>
