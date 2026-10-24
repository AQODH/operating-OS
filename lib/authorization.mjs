const rights={owner:['read','create','post','approve','invite'],officer:['read','create','approve'],treasurer:['read','create','post'],viewer:['read']};
export function authorize(role,action){if(!rights[role]?.includes(action))throw new Error('Permission denied');}
export function approveLoan(loan,actor){if(loan.status!=='submitted')throw new Error('Loan is not awaiting approval');if(loan.requestedBy===actor)throw new Error('A different officer must approve this loan');return {...loan,status:'approved',approvedBy:actor};}
