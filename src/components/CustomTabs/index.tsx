import React from 'react';

import Tab, { ITab } from './Tab';
import styles from './customTabs.module.css';

interface Props {
  tabs: ITab[];
  activeTab?: number;
  handleChangeTab?: (tabIndex: number) => void;
}

const CustomTabs: React.FC<Props> = ({ tabs, activeTab, handleChangeTab }) => {
  return (
    <div className={styles.container}>
      {tabs.map((tab) => (
        <Tab
          onClick={handleChangeTab}
          key={tab.index}
          label={tab.label}
          Icon={tab.Icon}
          isActive={tab.index === activeTab}
          index={tab.index}
        />
      ))}
    </div>
  );
};

export default CustomTabs;
