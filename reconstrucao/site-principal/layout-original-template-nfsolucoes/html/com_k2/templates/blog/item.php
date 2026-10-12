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
//echo'<pre>';var_dump($this->item);die;
$extraFields = null;
if(!empty($this->item->extra_fields)){
  $extraFields = json_decode($this->item->extra_fields);
  
}
$postType = $extraFields[0]->value;
$postLink = $extraFields[1]->value;

// $postType = $extraFields[0]->value;
// $postLink = substr(JUtility::parseAttributes($extraFields[1]->value)['src'], strlen(JURI::base(true)));
?>

<!-- Standard Post -->
<div class="post">
  <div class="post-decor"></div>
  <span class="date"><?php echo JHtml::_('date', $this->item->created, 'd');?><br><small><?php echo JHtml::_('date', $this->item->created, 'M');?></small></span>
  <div class="post-media">
  <?php if($postType == '1') : ?>
    <img alt="<?php echo $this->item->title;?>" class="respimg" src="<?php echo JURI::root(true).$postLink;?>">
  <?php elseif($postType == '4') : ?>
    <div class="single-media">
      <ul class="slides">
  <?php
      foreach ($extraFields as $key => $field) :
      if($key > 0 && trim($field->value) !='') :
    ?>
      <li>
        <img alt="Image <?php echo ($key+1);?>" class="respimg" src="<?php echo JURI::root(true).$field->value;?>" >
      </li>
  <?php endif; endforeach; ?>
      </ul>
    </div>
  <?php elseif($postType == '2') : 
    $id = array();
    // get youtube video id from link
    preg_match('/[\\?\\&]v=([^\\?\\&]+)/', $postLink, $id);
        //support embed link pasted at link
        if(empty($id) || !is_array($id)){
            preg_match('/embed[\/]([^\\?\\&]+)[\\?]/', $postLink, $id);
        }
      if(!empty($id[1])) :
  ?>
    <div class="video-container">
      <!-- youtube -->
      <iframe src="http://www.youtube.com/embed/<?php echo $id[1];?>?" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
      <!-- End youtube -->
    </div>
    <?php endif;?>
  <?php elseif($postType == '3') :

  $id = array();
  // get vimeo video id from link
  preg_match('/http:\/\/vimeo.com\/(\d+)$/', $postLink, $id);

  if(!empty($id[1])) :

  ?>
    <div class="video-container">
      <!-- Vimeo -->
      <iframe  src="http://player.vimeo.com/video/<?php echo $id[1];?>?title=0&amp;byline=0&amp;portrait=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
      <!-- End Vimeo -->
    </div>
  <?php endif;?>
  
  <?php elseif($postType == '5') : 
    $url = str_replace(":", "%3A", $postLink);
  ?>
    <div class="video-container">
      <iframe src="https://w.soundcloud.com/player/?url=<?php echo $url;?>&amp;auto_play=false&amp;hide_related=false&amp;visual=true" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
    </div>
  <?php endif;?>
  </div>
  <div class="post-title">
    <h2><a href="#"><?php echo preg_replace('/--([^-]*)--/', '$1', $this->item->title);?></a></h2>
    <div class="post-meta">
      <h6>
        <?php if($this->item->params->get('itemAuthor')): ?>
          <?php echo JText::_('TPL_CASHEMIR_POSTED_BY_TEXT');?> 
          <!-- Item Author -->
          <?php if(isset($this->item->author->link) && $this->item->author->link): ?>
          <a href="<?php echo $this->item->author->link; ?>"><?php echo $this->item->author->name; ?></a>
          <?php else: ?>
          <a href="#"><?php echo $this->item->author->name; ?></a>
          <?php endif; ?>
        <?php endif; ?> 
        
        <?php if($this->item->params->get('itemCategory')): ?>
          <!-- Item category name -->
          / 
          <a href="<?php echo $this->item->category->link; ?>"><?php echo preg_replace('/--([^-]*)--/', '$1', $this->item->category->name);?></a>
        <?php endif; ?>
      </h6>     

    </div>
  </div>        
    
  <div class="post-body">
    <?php if(!empty($this->item->fulltext)): ?>
          <?php if($this->item->params->get('itemIntroText')): ?>
          <!-- Item introtext -->
            <?php echo $this->item->introtext; ?>
          <?php endif; ?>
          <?php if($this->item->params->get('itemFullText')): ?>
          <!-- Item fulltext -->
            <?php echo $this->item->fulltext; ?>
          <?php endif; ?>
      <?php else: ?>
          <?php if($this->item->params->get('itemIntroText')): ?>
          <!-- Item introtext -->
            <?php echo $this->item->introtext; ?>
          <?php endif; ?>
      <?php endif; ?>
    <div>
    </div>
  </div>
</div>
<!-- social share buttons -->
<?php if($this->item->params->get('itemTwitterButton',1) || $this->item->params->get('itemFacebookButton',1) || $this->item->params->get('itemGooglePlusOneButton',1)): ?>
<!-- Socials section -->
<div class="grid-mb" id="socials">
  <!-- Social sharing -->
  <p><?php echo JText::_('TPL_CASHEMIR_SHARE_THIS_POST_TEXT');?></p>
  <ul class="social-box">
    <?php if($this->item->params->get('itemFacebookButton',1)): ?>
    <!-- Facebook Button -->
    <li class="itemFacebookButton">
        <div id="fb-root"></div>
        <script type="text/javascript">
            (function(d, s, id) {
              var js, fjs = d.getElementsByTagName(s)[0];
              if (d.getElementById(id)) return;
              js = d.createElement(s); js.id = id;
              js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
              fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        </script>
        <div class="fb-like" data-send="false" data-width="200" data-show-faces="true"></div>
    </li>
    <?php endif; ?>

    <?php if($this->item->params->get('itemTwitterButton',1)): ?>
    <!-- Twitter Button -->
    <li class="itemTwitterButton">
        <a href="https://twitter.com/share" class="twitter-share-button" data-count="horizontal"<?php if($this->item->params->get('twitterUsername')): ?> data-via="<?php echo $this->item->params->get('twitterUsername'); ?>"<?php endif; ?>>
            <?php echo JText::_('K2_TWEET'); ?>
        </a>
        <script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
    </li>
    <?php endif; ?>

    

    <?php if($this->item->params->get('itemGooglePlusOneButton',1)): ?>
    <!-- Google +1 Button -->
    <li class="itemGooglePlusOneButton">
        <g:plusone annotation="inline" width="120"></g:plusone>
        <script type="text/javascript">
          (function() {
            window.___gcfg = {lang: 'en'}; // Define button default language here
            var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
            po.src = 'https://apis.google.com/js/plusone.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
          })();
        </script>
    </li>
    <?php endif; ?>
  </ul>
</div>
<?php endif;?> 

<!--comment section-->

<div id="comments">

  <?php if($this->item->params->get('commentsFormPosition')=='above' && $this->item->params->get('itemComments') && !JRequest::getInt('print') && ($this->item->params->get('comments') == '1' || ($this->item->params->get('comments') == '2' && K2HelperPermissions::canAddComment($this->item->catid)))): ?>
  <!-- Item comments form -->
    <?php echo $this->loadTemplate('comments_form'); ?>

  <?php endif; ?>  

  <!-- Plugins: AfterDisplay -->
  <?php echo $this->item->event->AfterDisplay; ?>

  <!-- K2 Plugins: K2AfterDisplay -->
  <?php echo $this->item->event->K2AfterDisplay; ?>

  <?php if($this->item->params->get('itemComments') && ( ($this->item->params->get('comments') == '2' && !$this->user->guest) || ($this->item->params->get('comments') == '1'))): ?>
  <!-- K2 Plugins: K2CommentsBlock -->
  <?php echo $this->item->event->K2CommentsBlock; ?>
  <?php endif; ?>

  <?php if($this->item->params->get('itemComments') && ($this->item->params->get('comments') == '1' || ($this->item->params->get('comments') == '2')) && empty($this->item->event->K2CommentsBlock)): ?>
    <?php if($this->item->numOfComments>0 && $this->item->params->get('itemComments') && ($this->item->params->get('comments') == '1' || ($this->item->params->get('comments') == '2'))): ?>
      <!-- Item user comments -->
      <!--title-->
      <h6 id="comments-title"><?php echo ($this->item->numOfComments>1) ? JText::_('K2_COMMENTS') : JText::_('K2_COMMENT'); ?>  <span>(<?php echo $this->item->numOfComments; ?>)</span></h6>
    
    

    <!-- Commentlist -->
    <ul class="commentlist clear">

    <?php foreach ($this->item->comments as $key=>$comment): 
      if(($key+1)% 2 == 0){
        $class = "even thread-even";
      }else{
        $class = "odd thread-odd";
      }
    ?>
      <li class="comment">
      <div class="comment-body">
        <div class="comment-author">
          <img alt='<?php echo JFilterOutput::cleanText($comment->userName); ?>' src="<?php echo $comment->userImage; ?>" height="50" width="50">
        </div>

        <cite class="fn"><a href="<?php echo (!empty($comment->userLink))? JFilterOutput::cleanText($comment->userLink): '#'; ?>"><?php echo $comment->userName; ?></a></cite>

        <div class="comment-meta">
          <h6><a href="#"><?php echo JHTML::_('date', $comment->commentDate, JText::_('K2_DATE_FORMAT_LC2')); ?></a></h6>
        </div>

        <p><?php echo $comment->commentText; ?></p>
      </div>
    </li>
  
      <?php endforeach; ?>
    </ul><!-- End comment list -->

    <div class="itemCommentsPagination">
      <?php echo $this->pagination->getPagesLinks(); ?>
    </div>
    <?php endif;?>
  <?php endif;?>
  
  <?php if($this->item->params->get('commentsFormPosition')=='below' && $this->item->params->get('itemComments') && !JRequest::getInt('print') && ($this->item->params->get('comments') == '1' || ($this->item->params->get('comments') == '2' && K2HelperPermissions::canAddComment($this->item->catid)))): ?>
    <!-- Item comments form -->
    <?php echo $this->loadTemplate('comments_form'); ?>
  <?php endif; ?>

  <?php $user = JFactory::getUser(); if ($this->item->params->get('comments') == '2' && $user->guest): ?>
    <div><a href="<?php echo JRoute::_('index.php?option=com_users&view=login');?>"><?php echo JText::_('K2_LOGIN_TO_POST_COMMENTS'); ?></a></div>
  <?php endif; ?>


  </div>


