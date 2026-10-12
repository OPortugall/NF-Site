<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
defined('_JEXEC') or die;

JHtml::_('behavior.keepalive');
?>
	
	<form class="form-signin <?php echo $this->pageclass_sfx?>" action="<?php echo JRoute::_('index.php?option=com_users&task=user.login'); ?>" method="post" role="form">
<?php if ($this->params->get('show_page_heading')) : ?>
	<h3 class="form-signin-heading"><?php echo $this->escape($this->params->get('page_heading')); ?></h3>
	<?php if (($this->params->get('logindescription_show') == 1 && str_replace(' ', '', $this->params->get('login_description')) != '') || $this->params->get('login_image') != '') : ?>
	<div class="login-description">
	<?php endif; ?>

		<?php if ($this->params->get('logindescription_show') == 1) : ?>
			<?php echo $this->params->get('login_description'); ?>
		<?php endif; ?>

		<?php if (($this->params->get('login_image') != '')) :?>
			<img src="<?php echo $this->escape($this->params->get('login_image')); ?>" class="login-image" alt="<?php echo JTEXT::_('COM_USER_LOGIN_IMAGE_ALT')?>"/>
		<?php endif; ?>

	<?php if (($this->params->get('logindescription_show') == 1 && str_replace(' ', '', $this->params->get('login_description')) != '') || $this->params->get('login_image') != '') : ?>
	</div>
	<?php endif; ?>
	<?php endif; ?>

	  <?php foreach ($this->form->getFieldset('credentials') as $field) : 
	  //echo'<pre>';var_dump($field);die;
	  ?>
		<?php if (!$field->hidden) : ?>

        <input type="<?php echo $field->getAttribute('type');?>" name="<?php echo $field->getAttribute('name');?>"  class="form-control <?php echo $field->getAttribute('class');?>" id="<?php echo $field->getAttribute('id');?>" placeholder="<?php echo JText::_($field->getAttribute('label'));?>" <?php if($field->getAttribute('required') == 'true') echo ' required aria-required="true"';?>>
		<?php endif; ?>
	<?php endforeach; ?>

	<?php if ($this->tfa): ?>
		<div class="form-group">
	    <?php echo $this->form->getField('secretkey')->label; ?>
	    <div class="col-sm-10">
	      <?php echo $this->form->getField('secretkey')->input; ?>
	    </div>
	  </div>

	<?php endif; ?>
<?php if (JPluginHelper::isEnabled('system', 'remember')) : ?>
	<label class="checkbox">
      <input id="remember" type="checkbox" name="remember" class="inputbox" value="yes"/> <?php echo JText::_('COM_USERS_LOGIN_REMEMBER_ME') ?>
    </label>
<?php endif; ?>
	  
	<button type="submit" class="btn btn-primary"><?php echo JText::_('JLOGIN'); ?></button>

	 <input type="hidden" name="return" value="<?php echo base64_encode($this->params->get('login_redirect_url', $this->form->getValue('return'))); ?>" />
			<?php echo JHtml::_('form.token'); ?>
	</form>

<div class="form-signin">
	<ul class="list-unstyled">
		<li>
			<a href="<?php echo JRoute::_('index.php?option=com_users&view=reset'); ?>">
			<?php echo JText::_('COM_USERS_LOGIN_RESET'); ?></a>
		</li>
		<li>
			<a href="<?php echo JRoute::_('index.php?option=com_users&view=remind'); ?>">
			<?php echo JText::_('COM_USERS_LOGIN_REMIND'); ?></a>
		</li>
		<?php
		$usersConfig = JComponentHelper::getParams('com_users');
		if ($usersConfig->get('allowUserRegistration')) : ?>
		<li>
			<a href="<?php echo JRoute::_('index.php?option=com_users&view=registration'); ?>">
				<?php echo JText::_('COM_USERS_LOGIN_REGISTER'); ?></a>
		</li>
		<?php endif; ?>
	</ul>
</div>
