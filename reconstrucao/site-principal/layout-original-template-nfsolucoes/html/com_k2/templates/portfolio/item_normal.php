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

<div class="sections ws simple-page">
    <div class="content">
    <?php if(!empty($this->portfolioHeaderIcon)) :?>
      <div class="quote-icon"><i class="<?php echo $this->portfolioHeaderIcon;?>"></i></div>
    <?php endif;?>
      <div class="container">

      <div class="grid-4">
        
          <div class="post-media">    
            
            <?php if($this->postType == '1') : ?>
            <div class="single-media single-portfolio">
              <img alt="<?php echo $this->item->title;?>" class="respimg" src="<?php echo JURI::root(true).$this->postLink;?>">
            </div>
            <?php elseif($this->postType == '4') : ?>
            <div class="single-media single-portfolio">
              <div class="popup-gallery" >
              <?php $index = 0;
                foreach ($this->extraFields as $key => $field) :
                if($key > 4 && trim($field->value) !='') :
                  $index++;
              ?>
                <a href="<?php echo JURI::root(true).$field->value;?>" class="grid-2" title="folio img"><span></span><img src="<?php echo JURI::root(true).$field->value;?>" class="respimg gal" alt="Image <?php echo $index;?>" title="Image <?php echo $index;?>"></a>
            <?php endif; endforeach; ?>
              </div>
              <div class="clear"></div>
            </div>
            <?php elseif($this->postType == '6') : ?>
            <div class="single-media single-portfolio">
                <ul class="slides">
            <?php $index = 0;
                foreach ($this->extraFields as $key => $field) :
                if($key > 4 && trim($field->value) !='') :
                  $index++;
              ?>
                <li>
                  <img alt="Image <?php echo $index;?>" class="respimg" src="<?php echo JURI::root(true).$field->value;?>" >
                </li>
            <?php endif; endforeach; ?>
                </ul>
            </div>
            <?php elseif($this->postType == '2') : 
              $id = array();
              // get youtube video id from link
              preg_match('/[\\?\\&]v=([^\\?\\&]+)/', $this->postLink, $id);
                  //support embed link pasted at link
                  if(empty($id) || !is_array($id)){
                      preg_match('/embed[\/]([^\\?\\&]+)[\\?]/', $this->postLink, $id);
                  }
                if(!empty($id[1])) :
            ?>
            <div class="single-media single-portfolio">
              <div class="video-container">
                <!-- youtube -->
                <iframe src="http://www.youtube.com/embed/<?php echo $id[1];?>?" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
                <!-- End youtube -->
              </div>
            </div>
              <?php endif;?>
            <?php elseif($this->postType == '3') :

            $id = array();
            // get vimeo video id from link
            preg_match('/http:\/\/vimeo.com\/(\d+)$/', $this->postLink, $id);

            if(!empty($id[1])) :

            ?>
            <div class="single-media single-portfolio">
              <div class="video-container">
                <!-- Vimeo -->
                <iframe  src="http://player.vimeo.com/video/<?php echo $id[1];?>?title=0&amp;byline=0&amp;portrait=0" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
                <!-- End Vimeo -->
              </div>
            </div>
            <?php endif;?>
            
            <?php elseif($this->postType == '5') : 
              $url = str_replace(":", "%3A", $this->postLink);
            ?>
            <div class="single-media single-portfolio">
              <div class="video-container">
                <iframe src="https://w.soundcloud.com/player/?url=<?php echo $url;?>&amp;auto_play=false&amp;hide_related=false&amp;visual=true" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
              </div>
            </div>
            <?php endif;?>  
          </div>
          
        </div>
        <div class="grid-2">
  
          <div class="project-info">
              <div class="project-description">
                <h3><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_PROJECT_DESCRIPTION_TEXT');?></h3>  
                <?php echo $this->item->introtext ;?>
              </div>
            
              <div class="project-details">
                <h3><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_PROJECT_DETAILS_TEXT');?></h3>

                <?php if(!empty($this->extraFields[2]->value)) :?>
                <p><span><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_CLIENT_TEXT');?></span>: <?php echo $this->extraFields[2]->value;?></p>
                <?php endif;?>

                <p><span><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_DATE_TEXT');?></span>: <?php echo JHtml::_('date', $this->item->created, 'jS F, Y');?></p>
                <?php if($this->item->params->get('itemTags') && count($this->item->tags)):
                  $tags = array();
                  foreach ($this->item->tags as $tag){
                    $tags[] = ucfirst($tag->name);
                  } ?>
                <p><span><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_TAGS_TEXT');?></span>: <?php echo implode(", ", $tags) ;?></p>  
                <?php endif;?>
                <?php if(!empty($this->extraFields[3]->value)) :?>
                <a href="<?php echo $this->extraFields[3]->value;?>" class="transition"><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_LANCH_PROJECT_TEXT');?></a>                                      
                <?php endif;?>

              </div>
              <div class="clear"></div>
              <div class="share-options">
                <h6><?php echo JText::_('TPL_CASHEMIR_PORTFOLIO_SHARE_TEXT');?> : </h6>
                <a href="" class="transition"><i class="fa fa-twitter"></i></a>
                <a href="" class="transition"><i class="fa fa-facebook"></i></a>
                <a href="" class="transition"><i class="fa fa-pinterest"></i></a>
                <a href="" class="transition"><i class="fa fa-google-plus"></i></a>
                <a href="" class="transition"><i class="fa fa-share"></i></a>
                <a href="" class="transition"><i class="fa fa-linkedin"></i></a>
              </div>
              
              
            </div>
            
          </div>      
          
          <div class="portfolio-nav">
          <span></span>
          <?php if(isset($this->item->previousLink)): ?>
            <a href="<?php echo $this->item->previousLink;?>" class="transition"><i class="fa fa-angle-left"></i></a>
          <?php endif;?>
            <a href="<?php echo JURI::root(true);?>" class="transition"><i class="fa fa-th"></i></a>
          <?php if(isset($this->item->nextLink)): ?>
            <a href="<?php echo $this->item->nextLink;?>" class="transition"><i class="fa fa-angle-right"></i></a>
          <?php endif;?>
          </div>  


    </div>
  </div>
</div>