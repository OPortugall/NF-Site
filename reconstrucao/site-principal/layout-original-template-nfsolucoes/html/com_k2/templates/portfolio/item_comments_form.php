<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */

// no direct access
defined('_JEXEC') or die;

?>
<div id="respond" class="clear">
  <h6 id="reply-title"><?php echo JText::_('K2_LEAVE_A_COMMENT') ?></h6>
  
  <div class="comment-reply-form clear">
    <form action="<?php echo JURI::root(); ?>" method="post" id="comment-form" class="form-horizontal" name="comment-form">

      <div class="comment-form-author control-group">
        <div class="controls">
          <input id="userName" name="userName" type="text" value="" size="40" aria-required="true" />
        </div>
        <label class="control-label" for="userName"><?php echo JText::_('TPL_CASHEMIR_NAME_TEXT');?> </label>
      </div>

      <div class="comment-form-email control-group">
        <div class="controls">
          <input id="commentEmail" name="commentEmail" type="text" value="" size="40" aria-required="true" />
        </div>
        <label class="control-label" for="email"><?php echo JText::_('TPL_CASHEMIR_EMAIL_TEXT');?> </label>
      </div>

      <div class="comment-form-comment control-group">
        <div class="controls">
          <textarea id="commentText" name="commentText" cols="50" rows="8" aria-required="true" placeholder="<?php echo JText::_('TPL_CASHEMIR_YOUR_COMMENT_HERE_TEXT');?>">
          </textarea>
        </div>
      </div>
      <div class="comment-form-recaptcha control-group">
          <?php if($this->params->get('recaptcha') && ($this->user->guest || $this->params->get('recaptchaForRegistered', 1))): ?>
            <label class="formRecaptcha"><?php echo JText::_('K2_ENTER_THE_TWO_WORDS_YOU_SEE_BELOW'); ?></label>
            <div id="recaptcha"></div>
          <?php endif; ?>
        </div>

      <div class="form-submit">
        <div class="controls">
              <button class="btn btn-success" id="submitCommentButton" type="submit"><?php echo JText::_('TPL_CASHEMIR_POST_COMMENT_TEXT') ?></button>
               <br/><br/><span id="formLog"></span>
        </div>
            <input type="hidden" name="option" value="com_k2" />
            <input type="hidden" name="view" value="item" />
            <input type="hidden" name="task" value="comment" />
            <input type="hidden" name="itemID" value="<?php echo JRequest::getInt('id'); ?>" />
            <?php echo JHTML::_('form.token'); ?>
      </div>
    </form>
  </div>
</div><!--end respond-->
