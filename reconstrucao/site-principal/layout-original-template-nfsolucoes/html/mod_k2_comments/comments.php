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

<?php if(count($comments)): ?>
<ul id="recentcomments">
	<?php foreach ($comments as $key=>$comment):	?>
	<li class="recentcomments">
		<?php echo $comment->userName.' '. JText::_('TPL_MOMENTUM_COMMENTS_ON_TEXT');?> <a href="<?php echo $comment->link; ?>"><?php echo $comment->title; ?></a>
	</li>
	<?php endforeach; ?>
</ul>
<?php endif; ?>
