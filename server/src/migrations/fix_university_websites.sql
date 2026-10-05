-- Fix fake/placeholder university website URLs with real ones
-- This enables the Logo component to fetch favicons via icon.horse

-- === UNITED KINGDOM ===
UPDATE universities SET website = 'https://www.birmingham.ac.uk' WHERE slug = 'university-of-birmingham';
UPDATE universities SET website = 'https://www.bristol.ac.uk' WHERE slug = 'university-of-bristol';
UPDATE universities SET website = 'https://www.cardiff.ac.uk' WHERE slug = 'cardiff-university';
UPDATE universities SET website = 'https://www.durham.ac.uk' WHERE slug = 'durham-university';
UPDATE universities SET website = 'https://www.exeter.ac.uk' WHERE slug = 'university-of-exeter';
UPDATE universities SET website = 'https://www.gla.ac.uk' WHERE slug = 'university-of-glasgow';
UPDATE universities SET website = 'https://www.leeds.ac.uk' WHERE slug = 'university-of-leeds';
UPDATE universities SET website = 'https://www.liverpool.ac.uk' WHERE slug = 'university-of-liverpool';
UPDATE universities SET website = 'https://www.ncl.ac.uk' WHERE slug = 'newcastle-university';
UPDATE universities SET website = 'https://www.nottingham.ac.uk' WHERE slug = 'university-of-nottingham';
UPDATE universities SET website = 'https://www.qmul.ac.uk' WHERE slug = 'queen-mary-university-of-london';
UPDATE universities SET website = 'https://www.qub.ac.uk' WHERE slug = 'queen-s-university-belfast';
UPDATE universities SET website = 'https://www.sheffield.ac.uk' WHERE slug = 'university-of-sheffield';
UPDATE universities SET website = 'https://www.southampton.ac.uk' WHERE slug = 'university-of-southampton';
UPDATE universities SET website = 'https://www.york.ac.uk' WHERE slug = 'university-of-york';

-- === GERMANY ===
UPDATE universities SET website = 'https://www.kit.edu' WHERE slug = 'karlsruhe-institute-of-technology';
UPDATE universities SET website = 'https://www.tu.berlin' WHERE slug = 'technical-university-of-berlin';
UPDATE universities SET website = 'https://www.tu-darmstadt.de' WHERE slug = 'technical-university-of-darmstadt';
UPDATE universities SET website = 'https://www.uni-stuttgart.de' WHERE slug = 'university-of-stuttgart';
UPDATE universities SET website = 'https://www.uni-hannover.de' WHERE slug = 'leibniz-university-hannover';
UPDATE universities SET website = 'https://www.tu-braunschweig.de' WHERE slug = 'technische-universitat-braunschweig';
UPDATE universities SET website = 'https://www.fh-aachen.de' WHERE slug = 'fh-aachen';
UPDATE universities SET website = 'https://www.frankfurt-university.de' WHERE slug = 'frankfurt-uas';
UPDATE universities SET website = 'https://www.haw-hamburg.de' WHERE slug = 'haw-hamburg';
UPDATE universities SET website = 'https://www.htw-berlin.de' WHERE slug = 'htw-berlin';
UPDATE universities SET website = 'https://www.hs-aalen.de' WHERE slug = 'hochschule-aalen';
UPDATE universities SET website = 'https://www.h-brs.de' WHERE slug = 'hochschule-bonn-rhein-sieg';
UPDATE universities SET website = 'https://www.hs-bremen.de' WHERE slug = 'hochschule-bremen';
UPDATE universities SET website = 'https://h-da.de' WHERE slug = 'hochschule-darmstadt';
UPDATE universities SET website = 'https://www.hs-esslingen.de' WHERE slug = 'hochschule-esslingen';
UPDATE universities SET website = 'https://www.h-ka.de' WHERE slug = 'hochschule-karlsruhe';
UPDATE universities SET website = 'https://www.hnu.de' WHERE slug = 'hochschule-neu-ulm';
UPDATE universities SET website = 'https://www.hs-offenburg.de' WHERE slug = 'hochschule-offenburg';
UPDATE universities SET website = 'https://www.rwu.de' WHERE slug = 'hochschule-ravensburg-weingarten';
UPDATE universities SET website = 'https://www.reutlingen-university.de' WHERE slug = 'hochschule-reutlingen';
UPDATE universities SET website = 'https://www.hm.edu' WHERE slug = 'munich-university-of-applied-sciences';
UPDATE universities SET website = 'https://www.th-koeln.de' WHERE slug = 'th-koln';
UPDATE universities SET website = 'https://www.thm.de' WHERE slug = 'th-mittelhessen';
UPDATE universities SET website = 'https://www.th-nuernberg.de' WHERE slug = 'th-nurnberg';
UPDATE universities SET website = 'https://www.thi.de' WHERE slug = 'technische-hochschule-ingolstadt';

-- === CHINA ===
UPDATE universities SET website = 'https://en.sjtu.edu.cn' WHERE slug = 'shanghai-jiao-tong-university';
UPDATE universities SET website = 'https://www.zju.edu.cn' WHERE slug = 'zhejiang-university';
UPDATE universities SET website = 'https://www.nju.edu.cn' WHERE slug = 'nanjing-university';
UPDATE universities SET website = 'https://en.ustc.edu.cn' WHERE slug = 'university-of-science-and-technology-of-china-ustc';
UPDATE universities SET website = 'https://en.hit.edu.cn' WHERE slug = 'harbin-institute-of-technology';
UPDATE universities SET website = 'https://en.xjtu.edu.cn' WHERE slug = 'xi-an-jiaotong-university';
UPDATE universities SET website = 'https://ev.buaa.edu.cn' WHERE slug = 'beihang-university';
UPDATE universities SET website = 'https://english.bit.edu.cn' WHERE slug = 'beijing-institute-of-technology';
UPDATE universities SET website = 'https://english.hust.edu.cn' WHERE slug = 'huazhong-university-of-science-and-technology';
UPDATE universities SET website = 'https://en.whu.edu.cn' WHERE slug = 'wuhan-university';
UPDATE universities SET website = 'https://en.uestc.edu.cn' WHERE slug = 'university-of-electronic-science-and-technology-of-china';
UPDATE universities SET website = 'https://www.seu.edu.cn' WHERE slug = 'southeast-university';
UPDATE universities SET website = 'https://en.xidian.edu.cn' WHERE slug = 'xidian-university';
UPDATE universities SET website = 'https://www.tju.edu.cn' WHERE slug = 'tianjin-university';
UPDATE universities SET website = 'https://www.scu.edu.cn' WHERE slug = 'sichuan-university';
UPDATE universities SET website = 'https://www.sysu.edu.cn' WHERE slug = 'sun-yat-sen-university';
UPDATE universities SET website = 'https://www.en.sdu.edu.cn' WHERE slug = 'shandong-university';
UPDATE universities SET website = 'https://en.xmu.edu.cn' WHERE slug = 'xiamen-university';
UPDATE universities SET website = 'https://en.tongji.edu.cn' WHERE slug = 'tongji-university';
UPDATE universities SET website = 'https://en.nankai.edu.cn' WHERE slug = 'nankai-university';
UPDATE universities SET website = 'https://en.csu.edu.cn' WHERE slug = 'central-south-university';

-- === CANADA ===
UPDATE universities SET website = 'https://www.dal.ca' WHERE slug = 'dalhousie-university';
UPDATE universities SET website = 'https://umanitoba.ca' WHERE slug = 'university-of-manitoba';
UPDATE universities SET website = 'https://www.uottawa.ca' WHERE slug = 'university-of-ottawa';
UPDATE universities SET website = 'https://www.usask.ca' WHERE slug = 'university-of-saskatchewan';
UPDATE universities SET website = 'https://www.ulaval.ca' WHERE slug = 'universit-laval';
UPDATE universities SET website = 'https://www.uwo.ca' WHERE slug = 'western-university';

-- === AUSTRALIA ===
UPDATE universities SET website = 'https://www.newcastle.edu.au' WHERE slug = 'university-of-newcastle';
UPDATE universities SET website = 'https://www.unisa.edu.au' WHERE slug = 'university-of-south-australia';
UPDATE universities SET website = 'https://www.uts.edu.au' WHERE slug = 'university-of-technology-sydney';
UPDATE universities SET website = 'https://www.westernsydney.edu.au' WHERE slug = 'western-sydney-university';

-- === NETHERLANDS ===
UPDATE universities SET website = 'https://www.tue.nl' WHERE slug = 'eindhoven-university-of-technology';
UPDATE universities SET website = 'https://www.utwente.nl' WHERE slug = 'university-of-twente';

-- === JAPAN ===
UPDATE universities SET website = 'https://www.tsukuba.ac.jp' WHERE slug = 'university-of-tsukuba';

-- === NEW ZEALAND ===
UPDATE universities SET website = 'https://www.aut.ac.nz' WHERE slug = 'auckland-university-of-technology';
