module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT === 'development'
    ? 'development'
    : process.env.APP_VARIANT === 'preview'
      ? 'preview'
      : 'production';
  const isDevelopment = variant === 'development';
  const isPreview = variant === 'preview';
  const icon = isDevelopment
    ? './assets/brand/app-icon-dev.png'
    : isPreview
      ? './assets/brand/app-icon-beta.png'
      : './assets/brand/app-icon-first-minute.png';
  const suffix = isDevelopment ? '.dev' : isPreview ? '.beta' : '';
  const plugins = [
    ...(config.plugins ?? []),
    ['expo-dev-client', { addGeneratedScheme: isDevelopment }],
  ];

  return {
    ...config,
    name: isDevelopment ? 'Точка Роста Dev' : isPreview ? 'Точка Роста Beta' : 'Точка Роста',
    icon,
    scheme: isDevelopment ? 'tochkarosta-dev' : isPreview ? 'tochkarosta-beta' : 'tochkarostaapp',
    ios: {
      ...config.ios,
      bundleIdentifier: `ru.tochkarosta.app${suffix}`,
    },
    android: {
      ...config.android,
      package: `ru.tochkarosta.app${suffix}`,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: icon,
      },
    },
    plugins,
    extra: {
      ...(config.extra ?? {}),
      appVariant: variant,
      buildProfile: process.env.BUILD_PROFILE ?? (isDevelopment ? 'development' : isPreview ? 'preview' : 'production'),
      updateChannel: process.env.UPDATE_CHANNEL ?? (isDevelopment ? 'development' : isPreview ? 'preview' : 'production'),
    },
  };
};
