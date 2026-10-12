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
            


	<?php if(count($items)): ?>
  <ul>
    <?php foreach ($items as $item):	?>
      <?php if($params->get('itemImage')) : ?>
            <a href="<?php echo $item->link; ?>" class="pull-left">
              <img width="48px" height="45px" src="<?php echo $item->image; ?>" alt="<?php echo K2HelperUtilities::cleanHtml($item->title); ?>" class="media-object img-responsive">
            </a>
      <?php endif;?>
            <li>
              <a href="<?php echo $item->link; ?>"><?php echo $item->title;?></a></li>
            </li>

    <?php endforeach; ?>
  </ul>
  <?php endif;?>