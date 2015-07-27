CREATE TABLE IF NOT EXISTS `device` (
  `id` bigint(20) unsigned NOT NULL,
  `imei` varchar(80) COLLATE utf32_unicode_ci NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

CREATE TABLE IF NOT EXISTS `logtracking` (
  `id` bigint(20) unsigned NOT NULL,
  `imei` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `speed` int(11) NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `device` ADD PRIMARY KEY (`id`);
ALTER TABLE `logtracking` ADD PRIMARY KEY (`id`);
ALTER TABLE `device` MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1;
ALTER TABLE `logtracking` MODIFY `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1;