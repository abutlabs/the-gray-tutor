# Arithmetic

**In one sentence:** the PVM's arithmetic is 72 instructions that never crash: numbers
wrap around, and even dividing by zero has one fixed answer.

Pick an operation and two numbers, and read the result as 64 bits, as hex and as a signed
number. Then try the corners: divide by zero, or add 1 to the biggest signed 32-bit number.

<a id="try-it"></a>

<AluCorners />

## The idea

A pocket calculator shows an error when you divide by zero. A JAM validator can't. Every
validator runs the same program and must get the same result, so "error" is not good
enough: every sum needs one answer. On the PVM, arithmetic never crashes, and every corner
has a fixed result.

A register holds 64 bits, like a car's odometer. Add past the top and the count rolls
over and carries on. Divide by zero and you get all ones. The one division that doesn't
fit, the most negative number by −1, has its answer written down too.

The same bits can be read two ways: as a plain count, or as a signed number, where a set
top bit means negative. Division has an instruction for each reading. Most instructions
also come twice, in 32 and 64 bits, with a register or a constant as the second input.
That is how add, subtract, multiply, divide, shift, rotate, compare and pick grow into 72.

Each is one line in the Gray Paper and one line in your client. The lines are easy. The
corners are where the fun is.

## What the Gray Paper says

Appendix A.5, the tables with two registers and an immediate (its 131 to 161; 120 to 130
are [lesson 15.4](./04-memory.md)'s loads and stores through a register):

::: gray-paper A.5.10 2-2

#### Appendix A.5.10 Instructions with Arguments of Two Registers &amp; One Immediate, continued

<a id="gp-A-5-10-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 120 | `store_ind_u8` | ${{\mu}'}^\circlearrowleft_{{\varphi}_B + \nu_X} = {\varphi}_A \bmod 2^8$ |
| 121 | `store_ind_u16` | ${{\mu}'}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 2} = \mathcal{E}_{2}\left({\varphi}_A \bmod 2^{16}\right)$ |
| 122 | `store_ind_u32` | ${{\mu}'}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 4} = \mathcal{E}_{4}\left({\varphi}_A \bmod 2^{32}\right)$ |
| 123 | `store_ind_u64` | ${{\mu}'}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 8} = \mathcal{E}_{8}\left({\varphi}_A\right)$ |
| 124 | `load_ind_u8` | ${\varphi}'_A = {{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X}$ |
| 125 | `load_ind_i8` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\mathcal{Z}_{1}({{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X}))$ |
| 126 | `load_ind_u16` | ${\varphi}'_A = \mathcal{E}^{-1}_{2}\left({{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 2}\right)$ |
| 127 | `load_ind_i16` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\mathcal{Z}_{2}(\mathcal{E}^{-1}_{2}\left({{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 2}\right)))$ |
| 128 | `load_ind_u32` | ${\varphi}'_A = \mathcal{E}^{-1}_{4}\left({{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 4}\right)$ |
| 129 | `load_ind_i32` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\mathcal{Z}_{4}(\mathcal{E}^{-1}_{4}\left({{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 4}\right)))$ |
| 130 | `load_ind_u64` | ${\varphi}'_A = \mathcal{E}^{-1}_{8}\left({{\mu}}^\circlearrowleft_{{\varphi}_B + \nu_X \dots+ 8}\right)$ |
| 131 | `add_imm_32` | ${\varphi}'_A = \mathcal{X}_{4}\left(({\varphi}_B + \nu_X) \bmod 2^{32}\right)$ |
| 132 | `and_imm` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_A)_{i} = \mathcal{B}_{8}({\varphi}_B)_{i} \wedge \mathcal{B}_{8}(\nu_X)_{i}$ |
| 133 | `xor_imm` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_A)_{i} = \mathcal{B}_{8}({\varphi}_B)_{i} \oplus \mathcal{B}_{8}(\nu_X)_{i}$ |
| 134 | `or_imm` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_A)_{i} = \mathcal{B}_{8}({\varphi}_B)_{i} \vee \mathcal{B}_{8}(\nu_X)_{i}$ |
| 135 | `mul_imm_32` | ${\varphi}'_A = \mathcal{X}_{4}\left(({\varphi}_B \cdot \nu_X) \bmod 2^{32}\right)$ |
| 136 | `set_lt_u_imm` | ${\varphi}'_A = {\varphi}_B < \nu_X$ |
| 137 | `set_lt_s_imm` | ${\varphi}'_A = \mathcal{Z}_{8}({\varphi}_B) < \mathcal{Z}_{8}(\nu_X)$ |
| 138 | `shlo_l_imm_32` | ${\varphi}'_A = \mathcal{X}_{4}\left(({\varphi}_B \cdot 2^{\nu_X \bmod 32}) \bmod 2^{32}\right)$ |
| 139 | `shlo_r_imm_32` | ${\varphi}'_A = \mathcal{X}_{4}\left(\left\lfloor{\varphi}_B \bmod 2^{32} \div 2^{\nu_X \bmod 32}\right\rfloor\right)$ |
| 140 | `shar_r_imm_32` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\left\lfloor\mathcal{Z}_{4}({\varphi}_B \bmod 2^{32} ) \div 2^{\nu_X \bmod 32}\right\rfloor)$ |
| 141 | `neg_add_imm_32` | ${\varphi}'_A = \mathcal{X}_{4}\left((\nu_X + 2^{32} - {\varphi}_B) \bmod 2^{32}\right)$ |
| 142 | `set_gt_u_imm` | ${\varphi}'_A = {\varphi}_B > \nu_X$ |
| 143 | `set_gt_s_imm` | ${\varphi}'_A = \mathcal{Z}_{8}({\varphi}_B) > \mathcal{Z}_{8}(\nu_X)$ |
| 144 | `shlo_l_imm_alt_32` | ${\varphi}'_A = \mathcal{X}_{4}\left((\nu_X \cdot 2^{{\varphi}_B \bmod 32}) \bmod 2^{32}\right)$ |
| 145 | `shlo_r_imm_alt_32` | ${\varphi}'_A = \mathcal{X}_{4}\left(\left\lfloor\nu_X \bmod 2^{32} \div 2^{{\varphi}_B \bmod 32}\right\rfloor\right)$ |
| 146 | `shar_r_imm_alt_32` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\left\lfloor\mathcal{Z}_{4}(\nu_X \bmod 2^{32}) \div 2^{{\varphi}_B \bmod 32}\right\rfloor)$ |
| 147 | `cmov_iz_imm` | ${\varphi}'_A = \begin{cases} \nu_X &\text{if } {\varphi}_B = 0\\ {\varphi}_A &\text{otherwise} \end{cases}$ |
| 148 | `cmov_nz_imm` | ${\varphi}'_A = \begin{cases} \nu_X &\text{if } {\varphi}_B \ne 0\\ {\varphi}_A &\text{otherwise} \end{cases}$ |
| 149 | `add_imm_64` | ${\varphi}'_A = ({\varphi}_B + \nu_X) \bmod 2^{64}$ |
| 150 | `mul_imm_64` | ${\varphi}'_A = ({\varphi}_B \cdot \nu_X) \bmod 2^{64}$ |
| 151 | `shlo_l_imm_64` | ${\varphi}'_A = \mathcal{X}_{8}\left(({\varphi}_B \cdot 2^{\nu_X \bmod 64}) \bmod 2^{64}\right)$ |
| 152 | `shlo_r_imm_64` | ${\varphi}'_A = \mathcal{X}_{8}\left(\left\lfloor{\varphi}_B \div 2^{\nu_X \bmod 64}\right\rfloor\right)$ |
| 153 | `shar_r_imm_64` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\left\lfloor\mathcal{Z}_{8}({\varphi}_B) \div 2^{\nu_X \bmod 64}\right\rfloor)$ |
| 154 | `neg_add_imm_64` | ${\varphi}'_A = (\nu_X + 2^{64} - {\varphi}_B) \bmod 2^{64}$ |
| 155 | `shlo_l_imm_alt_64` | ${\varphi}'_A = (\nu_X \cdot 2^{{\varphi}_B \bmod 64}) \bmod 2^{64}$ |
| 156 | `shlo_r_imm_alt_64` | ${\varphi}'_A = \left\lfloor\nu_X \div 2^{{\varphi}_B \bmod 64}\right\rfloor$ |
| 157 | `shar_r_imm_alt_64` | ${\varphi}'_A = \mathcal{Z}_{8}^{-1} (\left\lfloor\mathcal{Z}_{8}(\nu_X) \div 2^{{\varphi}_B \bmod 64}\right\rfloor)$ |
| 158 | `rot_r_64_imm` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_A)_{i} = \mathcal{B}_{8}({\varphi}_B)_{(i + \nu_X) \bmod 64}$ |
| 159 | `rot_r_64_imm_alt` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_A)_{i} = \mathcal{B}_{8}(\nu_X)_{(i + {\varphi}_B) \bmod 64}$ |
| 160 | `rot_r_32_imm` | ${\varphi}'_A = \mathcal{X}_{4}\left(x\right) \  \text{where } x \in \mathbb{N}_{2^{32}}, \forall i \in \mathbb{N}_{32} : \mathcal{B}_{4}(x)_{i} = \mathcal{B}_{4}({\varphi}_B)_{(i + \nu_X) \bmod 32}$ |
| 161 | `rot_r_32_imm_alt` | ${\varphi}'_A = \mathcal{X}_{4}\left(x\right) \  \text{where } x \in \mathbb{N}_{2^{32}}, \forall i \in \mathbb{N}_{32} : \mathcal{B}_{4}(x)_{i} = \mathcal{B}_{4}(\nu_X)_{(i + {\varphi}_B) \bmod 32}$ |

:::

and with three registers, with the two helpers its divisions use:

::: gray-paper A.5.13 2-6

#### Appendix A.5.13 Instructions with Arguments of Three Registers, continued

<a id="gp-A-5-13-p2"></a>

| $\zeta_\imath$ | **Name** | **Mutations** |
| --- | --- | --- |
| 190 | `add_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(({\varphi}_A + {\varphi}_B) \bmod 2^{32}\right)$ |
| 191 | `sub_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(({\varphi}_A + 2^{32} - ({\varphi}_B \bmod 2^{32})) \bmod 2^{32}\right)$ |
| 192 | `mul_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(({\varphi}_A \cdot {\varphi}_B) \bmod 2^{32}\right)$ |
| 193 | `div_u_32` | ${\varphi}'_D = \begin{cases} 2^{64} - 1 &\text{if } {\varphi}_B \bmod 2^{32} = 0\\ \mathcal{X}_{4}\left(\left\lfloor({\varphi}_A \bmod 2^{32}) \div ({\varphi}_B \bmod 2^{32})\right\rfloor\right) &\text{otherwise} \end{cases}$ |
| 194 | `div_s_32` | ${\varphi}'_D = \begin{cases} 2^{64} - 1 &\text{if } b = 0\\ \mathcal{Z}_{8}^{-1} (a) &\text{if } a = -2^{31} \wedge b = -1\\ \mathcal{Z}_{8}^{-1} (\text{rtz}(a \div b)) &\text{otherwise} \\[2pt] \quad  \text{where } a = \mathcal{Z}_{4}({\varphi}_A \bmod 2^{32})\,,\ b = \mathcal{Z}_{4}({\varphi}_B \bmod 2^{32})\\ \end{cases}$ |
| 195 | `rem_u_32` | ${\varphi}'_D = \begin{cases} \mathcal{X}_{4}\left({\varphi}_A \bmod 2^{32}\right) &\text{if } {\varphi}_B \bmod 2^{32} = 0\\ \mathcal{X}_{4}\left(({\varphi}_A \bmod 2^{32}) \bmod ({\varphi}_B \bmod 2^{32})\right) &\text{otherwise} \end{cases}$ |
| 196 | `rem_s_32` | ${\varphi}'_D = \begin{cases} 0 &\text{if } a = -2^{31} \wedge b = -1 \\ \mathcal{Z}_{8}^{-1} (\text{smod}(a, b)) &\text{otherwise} \\[2pt] \quad  \text{where } a = \mathcal{Z}_{4}({\varphi}_A \bmod 2^{32})\,,\ b = \mathcal{Z}_{4}({\varphi}_B \bmod 2^{32})\\ \end{cases}$ |
| 197 | `shlo_l_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(({\varphi}_A \cdot 2^{{\varphi}_B \bmod 32}) \bmod 2^{32}\right)$ |
| 198 | `shlo_r_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(\left\lfloor({\varphi}_A \bmod 2^{32}) \div 2^{{\varphi}_B \bmod 32}\right\rfloor\right)$ |
| 199 | `shar_r_32` | ${\varphi}'_D = \mathcal{Z}_{8}^{-1} (\left\lfloor\mathcal{Z}_{4}({\varphi}_A \bmod 2^{32}) \div 2^{{\varphi}_B \bmod 32}\right\rfloor)$ |
| 200 | `add_64` | ${\varphi}'_D = ({\varphi}_A + {\varphi}_B) \bmod 2^{64}$ |
| 201 | `sub_64` | ${\varphi}'_D = ({\varphi}_A + 2^{64} - {\varphi}_B) \bmod 2^{64}$ |
| 202 | `mul_64` | ${\varphi}'_D = ({\varphi}_A \cdot {\varphi}_B) \bmod 2^{64}$ |
| 203 | `div_u_64` | ${\varphi}'_D = \begin{cases} 2^{64} - 1 &\text{if } {\varphi}_B = 0\\ \left\lfloor{\varphi}_A \div {\varphi}_B\right\rfloor &\text{otherwise} \end{cases}$ |
| 204 | `div_s_64` | ${\varphi}'_D = \begin{cases} 2^{64} - 1 &\text{if } {\varphi}_B = 0\\ {\varphi}_A &\text{if } \mathcal{Z}_{8}({\varphi}_A) = -2^{63} \wedge \mathcal{Z}_{8}({\varphi}_B) = -1\\ \mathcal{Z}_{8}^{-1} (\text{rtz}(\mathcal{Z}_{8}({\varphi}_A) \div \mathcal{Z}_{8}({\varphi}_B))) &\text{otherwise} \end{cases}$ |
| 205 | `rem_u_64` | ${\varphi}'_D = \begin{cases} {\varphi}_A &\text{if } {\varphi}_B = 0\\ {\varphi}_A \bmod {\varphi}_B &\text{otherwise} \end{cases}$ |
| 206 | `rem_s_64` | ${\varphi}'_D = \begin{cases} 0 &\text{if } \mathcal{Z}_{8}({\varphi}_A) = -2^{63} \wedge \mathcal{Z}_{8}({\varphi}_B) = -1\\ \mathcal{Z}_{8}^{-1} (\text{smod}(\mathcal{Z}_{8}({\varphi}_A), \mathcal{Z}_{8}({\varphi}_B))) &\text{otherwise} \end{cases}$ |
| 207 | `shlo_l_64` | ${\varphi}'_D = ({\varphi}_A \cdot 2^{{\varphi}_B \bmod 64}) \bmod 2^{64}$ |
| 208 | `shlo_r_64` | ${\varphi}'_D = \left\lfloor{\varphi}_A \div 2^{{\varphi}_B \bmod 64}\right\rfloor$ |
| 209 | `shar_r_64` | ${\varphi}'_D = \mathcal{Z}_{8}^{-1} (\left\lfloor\mathcal{Z}_{8}({\varphi}_A) \div 2^{{\varphi}_B \bmod 64}\right\rfloor)$ |
| 210 | `and` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \mathcal{B}_{8}({\varphi}_A)_{i} \wedge \mathcal{B}_{8}({\varphi}_B)_{i}$ |
| 211 | `xor` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \mathcal{B}_{8}({\varphi}_A)_{i} \oplus \mathcal{B}_{8}({\varphi}_B)_{i}$ |
| 212 | `or` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \mathcal{B}_{8}({\varphi}_A)_{i} \vee \mathcal{B}_{8}({\varphi}_B)_{i}$ |
| 213 | `mul_upper_s_s` | ${\varphi}'_D = \mathcal{Z}_{8}^{-1} (\left\lfloor(\mathcal{Z}_{8}({\varphi}_A) \cdot \mathcal{Z}_{8}({\varphi}_B)) \div 2^{64}\right\rfloor)$ |
| 214 | `mul_upper_u_u` | ${\varphi}'_D = \left\lfloor({\varphi}_A \cdot {\varphi}_B) \div 2^{64}\right\rfloor$ |
| 215 | `mul_upper_s_u` | ${\varphi}'_D = \mathcal{Z}_{8}^{-1} (\left\lfloor(\mathcal{Z}_{8}({\varphi}_A) \cdot {\varphi}_B) \div 2^{64}\right\rfloor)$ |
| 216 | `set_lt_u` | ${\varphi}'_D = {\varphi}_A < {\varphi}_B$ |
| 217 | `set_lt_s` | ${\varphi}'_D = \mathcal{Z}_{8}({\varphi}_A) < \mathcal{Z}_{8}({\varphi}_B)$ |
| 218 | `cmov_iz` | ${\varphi}'_D = \begin{cases} {\varphi}_A &\text{if } {\varphi}_B = 0\\ {\varphi}_D &\text{otherwise} \end{cases}$ |
| 219 | `cmov_nz` | ${\varphi}'_D = \begin{cases} {\varphi}_A &\text{if } {\varphi}_B \ne 0\\ {\varphi}_D &\text{otherwise} \end{cases}$ |
| 220 | `rot_l_64` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{(i + {\varphi}_B) \bmod 64} = \mathcal{B}_{8}({\varphi}_A)_{i}$ |
| 221 | `rot_l_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(x\right)\  \text{where } x \in \mathbb{N}_{2^{32}}, \forall i \in \mathbb{N}_{32} : \mathcal{B}_{4}(x)_{(i + {\varphi}_B) \bmod 32} = \mathcal{B}_{4}({\varphi}_A)_{i}$ |
| 222 | `rot_r_64` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \mathcal{B}_{8}({\varphi}_A)_{(i + {\varphi}_B) \bmod 64}$ |
| 223 | `rot_r_32` | ${\varphi}'_D = \mathcal{X}_{4}\left(x\right)\  \text{where } x \in \mathbb{N}_{2^{32}}, \forall i \in \mathbb{N}_{32} : \mathcal{B}_{4}(x)_{i} = \mathcal{B}_{4}({\varphi}_A)_{(i + {\varphi}_B) \bmod 32}$ |
| 224 | `and_inv` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \mathcal{B}_{8}({\varphi}_A)_{i} \wedge \lnot \mathcal{B}_{8}({\varphi}_B)_{i}$ |
| 225 | `or_inv` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \mathcal{B}_{8}({\varphi}_A)_{i} \vee \lnot \mathcal{B}_{8}({\varphi}_B)_{i}$ |
| 226 | `xnor` | $\forall i \in \mathbb{N}_{64} : \mathcal{B}_{8}({\varphi}'_D)_{i} = \lnot ( \mathcal{B}_{8}({\varphi}_A)_{i} \oplus \mathcal{B}_{8}({\varphi}_B)_{i} )$ |
| 227 | `max` | ${\varphi}'_D = \mathcal{Z}_{8}^{-1} (\max \left( \mathcal{Z}_{8}({\varphi}_A), \mathcal{Z}_{8}({\varphi}_B) \right))$ |
| 228 | `max_u` | ${\varphi}'_D = \max \left( {\varphi}_A, {\varphi}_B \right)$ |
| 229 | `min` | ${\varphi}'_D = \mathcal{Z}_{8}^{-1} (\min \left( \mathcal{Z}_{8}({\varphi}_A), \mathcal{Z}_{8}({\varphi}_B) \right))$ |
| 230 | `min_u` | ${\varphi}'_D = \min \left( {\varphi}_A, {\varphi}_B \right)$ |

<a id="gp-A-5-13-p3"></a>Note that the two signed modulo operations have an idiosyncratic definition, operating as the modulo of the absolute values, but with the sign of the numerator. Formally:

<a id="gp-A-5-13-p4"></a><a id="eq-A-36"></a>

$$
\begin{equation}
\text{smod}\colon\left\{ \begin{aligned}
\!\left\lgroup\mathbb{Z}, \mathbb{Z}\right\rgroup\! &\to \mathbb{Z}\\
\left(a, b\right) &\mapsto \begin{cases}
a &\text{if } b = 0\\
\text{sgn}(a) \cdot (\left\vert a\right\vert \bmod \left\vert b\right\vert) &\text{otherwise} \\
\end{cases}
\end{aligned} \right. \tag{A.36}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-smod">$\text{smod}$</span> | signed mod | the remainder of the sizes, with the sign of the number divided: smod(−7, 2) is −1 |
| <span id="gk-abracegroup">$\left\{ \begin{aligned}x\end{aligned} \right.$</span> | as follows | a brace grouping lines that hold together: for a function, its type on top, then what each input becomes |
| <span id="gk-tuple">$\!\left\lgroup x\right\rgroup\!$</span> | the tuple of | a record: named fields, each with its type, like an object in JSON |
| <span id="gk-Z" class="gk-wrap">$\mathbb{Z}$</span> | Z | the integers, negative ones too; a subscript gives the range |
| <span id="gk-to">[$\to$](../symbols.md#to)</span> | to | what goes in, to what comes out: A → B takes an A and gives a B |
| <span id="gk-mapsto">$\mapsto$</span> | maps to | what a function gives back for an input: x ↦ y says x becomes y |
| <span id="gk-cdot">$\cdot$</span> | times | multiply |
| <span id="gk-len">$\left\vert x\right\vert$</span> | the size of | \|x\|: how many items x has, or how many bytes |
| <span id="gk-bmod">[$\bmod$](../symbols.md#mod)</span> | mod | the remainder after dividing: 14 mod 4 is 2 |

</details>

→ [(A.36) explained](./gray-paper.md#ex-A-36)

<a id="gp-A-5-13-p5"></a>Division operations always round their result towards zero. Formally:

<a id="gp-A-5-13-p6"></a><a id="eq-A-37"></a>

$$
\begin{equation}
\text{rtz}\colon\left\{ \begin{aligned}
\mathbb{Z} &\to \mathbb{Z}\\
x &\mapsto \begin{cases}
\left\lceil x\right\rceil &\text{if } x < 0\\
\left\lfloor x\right\rfloor &\text{otherwise} \\
\end{cases}
\end{aligned} \right. \tag{A.37}
\end{equation}
$$

<details class="gp-key"><summary>Its symbols</summary>

| Symbol | Say it | Means |
| --- | --- | --- |
| <span id="gk-rtz">$\text{rtz}$</span> | round toward zero | a division's answer rounded toward zero: −3.5 becomes −3, 3.5 becomes 3 |
| <span id="gk-ceil">$\left\lceil x\right\rceil$</span> | ceiling of | rounded up to a whole number |
| <span id="gk-floor">[$\left\lfloor x\right\rfloor$](../symbols.md#floor)</span> | floor of | rounded down to a whole number |

</details>

→ [(A.37) explained](./gray-paper.md#ex-A-37)

:::

Registers hold 64 bits, and everything is modulo 2^64. The corners that
catch people:

- **32-bit instructions** work on the low 32 bits, and **sign-extend** the result back
  to 64: `add_32` of 2^31 − 1 and 1 isn't 2^31, it's `0xffffffff80000000`, which is
  −2^31. The low 32 bits are `80000000`, 2^31, whose top bit is 1: as a signed 32-bit
  number that's −2^31, and sign-extending copies the 1 into the 32 bits above, `ffffffff`.
- **Division by zero** doesn't crash. Division, signed or not, gives 2^64 − 1, all
  ones, and the remainder gives back the dividend.
- **−2^63 ÷ −1** would be 2^63, which doesn't fit in a signed 64-bit number, so the
  answer is −2^63 itself, and the remainder is 0.
- **Signed division rounds towards zero**: −7 ÷ 2 is −3, not −4. And the remainder keeps
  the *dividend's* sign: −7 rem 2 is −1, 7 rem −3 is 1. (The Gray Paper calls these rtz
  and smod.)
- **Shifts**: `shlo_r` (logical) fills with zeros; `shar_r` (arithmetic) keeps the sign,
  so −8 shifted right is −4. Shift amounts are taken mod 32 or mod 64.
- **The immediate forms** are the three-register ones with ν_X standing in for a
  register: `add_imm_64` writes φ_A from φ_B + ν_X. The **alt** forms swap the inputs:
  `shlo_l_imm_alt_32` shifts ν_X by φ_B. Two come only with an immediate, `neg_add_imm`
  (ν_X − φ_B) and `set_gt_imm` (φ_B > ν_X): with three registers you'd just swap them
  and use `sub` or `set_lt`.
- **`cmov`** moves a value only if a condition register is zero (`iz`) or not (`nz`),
  otherwise the destination keeps what it had.

Each corner is a preset [at the top](#try-it). Try them, then numbers of your own.

**Try it in the [playground](../pvm-playground.md).** Press **Any instruction** and pick `div_u_64` from the list. In the edit box change `.reg r8 = 0x10` to `.reg r8 = 0`, press **Assemble and reset**, then **Step**: dividing by zero gives −1, every bit set, and the machine carries on.

## The tests

**New file** `test/arithmetic.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";
import { OPERATIONS, operationOf } from "../src/pvm/arithmetic.ts";
import { opcodeInfo } from "../src/pvm/instructions.ts";

const MAX = 2n ** 64n - 1n; // all 64 bits set: −1, read as signed
const neg = (x: bigint) => 2n ** 64n - x; // −x, as 64 unsigned bits

/** The registers after running one instruction on them. */
function after(instruction: number[], registers: bigint[]): bigint[] {
  const machine = newMachine(assemble([instruction]), registers);
  step(machine);
  return machine.registers;
}

// Three-register instructions are [opcode, A + 16·B, D]: here A = r0, B = r1, D = r2.
const three = (opcode: number, r0: bigint, r1: bigint, r2 = 0n) =>
  after([opcode, 0x10, 2], [r0, r1, r2])[2];

test("a 32-bit result is sign-extended to 64 bits", () => {
  const add32: bigint = three(190, 0x7fffffffn, 1n); // add_32
  assert.equal(add32, 0xffffffff80000000n);
});

test("dividing by zero gives all ones; −2^63 ÷ −1 keeps −2^63", () => {
  const byZero: bigint = three(203, 5n, 0n); // div_u_64
  assert.equal(byZero, MAX);
  const overflow: bigint = three(204, 2n ** 63n, MAX); // div_s_64
  assert.equal(overflow, 2n ** 63n);
});

test("signed division rounds towards zero; the remainder keeps the dividend's sign", () => {
  const quotient: bigint = three(204, neg(7n), 2n); // −7 ÷ 2 = −3
  assert.equal(quotient, neg(3n));
  const remainder: bigint = three(206, neg(7n), 2n); // rem_s_64: −7 rem 2 = −1
  assert.equal(remainder, neg(1n));
  const positiveRemainder: bigint = three(206, 7n, neg(3n)); // 7 rem −3 = 1
  assert.equal(positiveRemainder, 1n);
});

test("shifts: arithmetic keeps the sign, logical doesn't", () => {
  const arithmetic: bigint = three(209, neg(8n), 1n); // shar_r_64
  assert.equal(arithmetic, neg(4n));
  const logical: bigint = three(208, 2n ** 63n, 63n); // shlo_r_64
  assert.equal(logical, 1n);
});

test("rotations carry the bits round", () => {
  const rotatedRight: bigint = three(222, 1n, 1n); // rot_r_64: bit 0 to bit 63
  assert.equal(rotatedRight, 2n ** 63n);
  const rotatedLeft: bigint = three(221, 0x80000000n, 1n); // rot_l_32: bit 31 to bit 0
  assert.equal(rotatedLeft, 1n);
});

test("immediate forms: φ_B with ν_X, and the alt forms the other way round", () => {
  // [opcode, A + 16·B, ν_X]: A = r2 gets the result, B = r1 holds 4, ν_X = 3
  const shifted: bigint = after([138, 0x12, 3], [0n, 4n])[2]; // shlo_l_imm_32: 4 << 3
  assert.equal(shifted, 32n);
  const shiftedAlt: bigint = after([144, 0x12, 3], [0n, 4n])[2]; // shlo_l_imm_alt_32: 3 << 4
  assert.equal(shiftedAlt, 48n);
});

test("cmov: move only if the condition register is zero (iz) or not (nz)", () => {
  const moved: bigint = three(218, 9n, 0n, 5n); // cmov_iz: r1 = 0, so r2 = r0
  assert.equal(moved, 9n);
  const stayed: bigint = three(218, 9n, 1n, 5n); // r1 ≠ 0, so r2 stays
  assert.equal(stayed, 5n);
  const movedImm: bigint = after([147, 0x12, 7], [0n, 0n, 5n])[2]; // cmov_iz_imm: r2 = 7
  assert.equal(movedImm, 7n);
});

test("the upper half of a product, and min/max signed or not", () => {
  const upper: bigint = three(214, MAX, MAX); // mul_upper_u_u: (2^64 − 1)² >> 64
  assert.equal(upper, MAX - 1n);
  const signedMax: bigint = three(227, MAX, 1n); // max: −1 < 1
  assert.equal(signedMax, 1n);
  const unsignedMax: bigint = three(228, MAX, 1n); // max_u: 2^64 − 1 > 1
  assert.equal(unsignedMax, MAX);
});

test("every arithmetic instruction in the GP's tables has an operation: 72 of them", () => {
  let covered = 0;
  for (let opcode = 0; opcode < 256; opcode++) {
    const info = opcodeInfo(opcode);
    const arithmetic = (opcode >= 131 && opcode <= 161) || opcode >= 190; // not loads or stores
    if (!info || !arithmetic) continue;
    const operation = OPERATIONS[operationOf(info.name).operation];
    assert.ok(operation, info.name);
    covered++;
  }
  assert.equal(covered, 72); // 31 with an immediate, 41 with three registers
});
```

Each test runs one instruction and looks at r2. The last test is the safety net: it
walks all 72 arithmetic opcodes of [lesson 15.2](./02-instructions.md)'s table and checks that each has an
operation. None can be forgotten.

## The code

**New file** `src/pvm/arithmetic.ts`

```ts
// Arithmetic and logic (GP App. A.5): every instruction that takes two numbers and makes a
// third, in 32 and 64 bits. One line each, straight from the GP's tables.

import { signed, signExtend } from "./instructions.ts";

const M32 = 2n ** 32n;
const M64 = 2n ** 64n;

/** x mod n, always from 0 to n − 1 (bigint's % keeps the sign of x). */
const mod = (x: bigint, n: bigint) => ((x % n) + n) % n;
/** A 32-bit result, sign-extended to 64 bits (GP's X₄). */
const ext32 = (x: bigint) => signExtend(4, mod(x, M32));
/** A register's low 32 bits, read as signed (Z₄), and the whole register (Z₈). */
const s32 = (x: bigint) => signed(4, mod(x, M32));
const s64 = (x: bigint) => signed(8, x);
/** A signed number back into 64 bits (Z₈⁻¹). */
const u64 = (x: bigint) => mod(x, M64);
const bool = (b: boolean) => (b ? 1n : 0n);
/** Rotations: x's bits moved k places round a word of n bits. */
const rotateRight = (x: bigint, k: bigint, n: bigint) =>
  mod((x >> k) | (x << (n - k)), 2n ** n);

/**
 * Each operation, by its three-register name: p and q are its two inputs (φ_A and φ_B,
 * or φ_B and ν_X for the immediate forms), and `old` the register being written.
 */
export const OPERATIONS: Record<string, (p: bigint, q: bigint, old: bigint) => bigint> = {
  add_32: (p, q) => ext32(p + q),
  sub_32: (p, q) => ext32(p + M32 - mod(q, M32)),
  mul_32: (p, q) => ext32(p * q),
  div_u_32: (p, q) => (mod(q, M32) === 0n ? M64 - 1n : ext32(mod(p, M32) / mod(q, M32))),
  div_s_32: (p, q) => {
    const [a, b] = [s32(p), s32(q)];
    if (b === 0n) return M64 - 1n;
    if (a === -(2n ** 31n) && b === -1n) return u64(a); // the one quotient that won't fit
    return u64(a / b); // bigint's / rounds towards zero, like the GP's rtz
  },
  rem_u_32: (p, q) => (mod(q, M32) === 0n ? ext32(p) : ext32(mod(p, M32) % mod(q, M32))),
  rem_s_32: (p, q) => {
    const [a, b] = [s32(p), s32(q)];
    if (a === -(2n ** 31n) && b === -1n) return 0n;
    return u64(b === 0n ? a : a % b); // % keeps a's sign, like the GP's smod
  },
  shlo_l_32: (p, q) => ext32(p << mod(q, 32n)),
  shlo_r_32: (p, q) => ext32(mod(p, M32) >> mod(q, 32n)),
  shar_r_32: (p, q) => u64(s32(p) >> mod(q, 32n)), // >> on a negative rounds down: arithmetic
  neg_add_32: (p, q) => ext32(q + M32 - p),
  rot_l_32: (p, q) => ext32(rotateRight(mod(p, M32), 32n - mod(q, 32n), 32n)),
  rot_r_32: (p, q) => ext32(rotateRight(mod(p, M32), mod(q, 32n), 32n)),
  add_64: (p, q) => mod(p + q, M64),
  sub_64: (p, q) => mod(p - q, M64),
  mul_64: (p, q) => mod(p * q, M64),
  div_u_64: (p, q) => (q === 0n ? M64 - 1n : p / q),
  div_s_64: (p, q) => {
    const [a, b] = [s64(p), s64(q)];
    if (b === 0n) return M64 - 1n;
    if (a === -(2n ** 63n) && b === -1n) return p;
    return u64(a / b);
  },
  rem_u_64: (p, q) => (q === 0n ? p : p % q),
  rem_s_64: (p, q) => {
    const [a, b] = [s64(p), s64(q)];
    if (a === -(2n ** 63n) && b === -1n) return 0n;
    return u64(b === 0n ? a : a % b);
  },
  shlo_l_64: (p, q) => mod(p << mod(q, 64n), M64),
  shlo_r_64: (p, q) => p >> mod(q, 64n),
  shar_r_64: (p, q) => u64(s64(p) >> mod(q, 64n)),
  neg_add_64: (p, q) => mod(q - p, M64),
  rot_l_64: (p, q) => rotateRight(p, 64n - mod(q, 64n), 64n),
  rot_r_64: (p, q) => rotateRight(p, mod(q, 64n), 64n),
  mul_upper_s_s: (p, q) => u64((s64(p) * s64(q)) >> 64n),
  mul_upper_u_u: (p, q) => (p * q) >> 64n,
  mul_upper_s_u: (p, q) => u64((s64(p) * q) >> 64n),
  and: (p, q) => p & q,
  or: (p, q) => p | q,
  xor: (p, q) => p ^ q,
  and_inv: (p, q) => mod(p & ~q, M64),
  or_inv: (p, q) => mod(p | ~q, M64),
  xnor: (p, q) => mod(~(p ^ q), M64),
  set_lt_u: (p, q) => bool(p < q),
  set_lt_s: (p, q) => bool(s64(p) < s64(q)),
  set_gt_u: (p, q) => bool(p > q),
  set_gt_s: (p, q) => bool(s64(p) > s64(q)),
  cmov_iz: (p, q, old) => (q === 0n ? p : old),
  cmov_nz: (p, q, old) => (q !== 0n ? p : old),
  max: (p, q) => u64(s64(p) > s64(q) ? s64(p) : s64(q)),
  max_u: (p, q) => (p > q ? p : q),
  min: (p, q) => u64(s64(p) < s64(q) ? s64(p) : s64(q)),
  min_u: (p, q) => (p < q ? p : q),
};

/**
 * An instruction's operation and the order of its inputs. The immediate forms share the
 * three-register operation: add_imm_64 is add_64, shlo_l_imm_alt_32 is shlo_l_32 with its
 * inputs swapped. cmov…_imm reads that way round too: its immediate is the value moved.
 */
export function operationOf(name: string): { operation: string; swapped: boolean } {
  const operation = name.replace("_imm", "").replace("_alt", "");
  const swapped = name.includes("_alt") || (name.startsWith("cmov") && name.endsWith("_imm"));
  return { operation, swapped };
}
```

Every operation takes p and q, plus `old`, the register being written (only `cmov` looks
at it). `bigint` never overflows, so the wrap-around is explicit: `mod` brings a result
back into 64 bits, `ext32` into 32, sign-extended. One trap: bigint's `%` keeps the sign
of its left side, so `-7n % 2n` is `-1n`. That is wrong for wrapping, so `mod` adds n
and takes `%` again:

```ts
const mod = (x: bigint, n: bigint) => ((x % n) + n) % n;
```

But that sign-keeping `%` is exactly the Gray Paper's smod, so the signed remainders use
it directly:

```ts
  rem_s_64: (p, q) => {
    const [a, b] = [s64(p), s64(q)];
    if (a === -(2n ** 63n) && b === -1n) return 0n;
    return u64(b === 0n ? a : a % b);
  },
```

−7 rem 2 is −1, and `u64` writes it into the register as 2^64 − 1. The line before covers
−2^63 rem −1, whose division would overflow: the Gray Paper makes it 0. A remainder
by 0 is the number itself.

`operationOf` maps the immediate and alt names onto the three-register ones, so one
table serves 72 instructions. `cmov…_imm` is the odd one out: its immediate is the
value moved, not the condition, so it reads the swapped way round.

[Lesson 15.3](./03-the-machine.md)'s `basics` had six of these instructions written out. They move to the new
family now, so `basics` gets shorter:

**Replace in** `src/pvm/machine.ts`

```ts
/** Lesson 15.3's instructions: control flow, and loading and moving values. */
function basics(m: Machine, ins: Instruction): Exit | undefined {
  const [a, b] = ins.registers; // the GP's register letters, in its order
  const [x] = ins.immediates;
  const reg = m.registers; // φ
  switch (ins.name) {
    case "trap":
      return "panic";
    case "fallthrough":
      return jumpTo(m, ins.next);
    case "jump":
      return jumpTo(m, ins.target as number);
    case "jump_ind":
      return jumpIndirect(m, (reg[a] + x) % 2n ** 32n);
    case "load_imm":
    case "load_imm_64":
      reg[a] = x;
      return "continue";
    case "move_reg": // registers [D, A]: φ′_D = φ_A
      reg[a] = reg[b];
      return "continue";
    case "branch_eq":
      return branch(m, ins, ins.target as number, reg[a] === reg[b]);
    case "branch_ne":
      return branch(m, ins, ins.target as number, reg[a] !== reg[b]);
    case "branch_eq_imm":
      return branch(m, ins, ins.target as number, reg[a] === x);
    case "branch_ne_imm":
      return branch(m, ins, ins.target as number, reg[a] !== x);
    default:
      return undefined; // not one of these
  }
}

/** Every family of instructions built so far. */
const FAMILIES: Family[] = [basics, memoryInstructions, arithmetic];
```

**Add to** `src/pvm/machine.ts`

```ts
import { OPERATIONS, operationOf } from "./arithmetic.ts";

/** Lesson 15.5's instructions: arithmetic and logic, with an immediate or three registers. */
function arithmetic(m: Machine, ins: Instruction): Exit | undefined {
  const { operation, swapped } = operationOf(ins.name);
  const f = OPERATIONS[operation];
  if (!f) return undefined;
  const [a, b, d] = ins.registers;
  const [x] = ins.immediates;
  const reg = m.registers;
  if (ins.layout === "regRegImm") {
    const [p, q] = swapped ? [x, reg[b]] : [reg[b], x]; // φ′_A from φ_B and ν_X
    reg[a] = f(p, q, reg[a]);
  } else {
    reg[d] = f(reg[a], reg[b], reg[d]); // three registers: φ′_D from φ_A and φ_B
  }
  return "continue";
}
```

**Run**

```sh
npm test
npm run typecheck
```

```text
...
✔ a 32-bit result is sign-extended to 64 bits (2.9ms)
✔ dividing by zero gives all ones; −2^63 ÷ −1 keeps −2^63 (0.3ms)
✔ signed division rounds towards zero; the remainder keeps the dividend's sign (0.2ms)
✔ shifts: arithmetic keeps the sign, logical doesn't (0.1ms)
✔ rotations carry the bits round (0.2ms)
✔ immediate forms: φ_B with ν_X, and the alt forms the other way round (0.1ms)
✔ cmov: move only if the condition register is zero (iz) or not (nz) (0.1ms)
✔ the upper half of a product, and min/max signed or not (0.1ms)
✔ every arithmetic instruction in the GP's tables has an operation: 72 of them (0.4ms)
...
✔ the reported packages: each one's hash and exports root, sorted by hash (211.3ms)
...
ℹ tests 416
ℹ suites 0
ℹ pass 416
ℹ fail 0
...
reported 416 tests to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=test-1791736632944
...
```

## Watch it

**New file** `bin/alu.ts`

```ts
// Runs the arithmetic edge cases the Gray Paper spells out, each as one instruction on
// your PVM, and shows the answers in hex and as signed numbers.
// Usage: npm run alu

import { Run } from "../src/obs.ts";
import { decodeInstruction } from "../src/pvm/instructions.ts";
import { newMachine, step } from "../src/pvm/machine.ts";
import { assemble } from "../src/pvm/program.ts";

const neg = (x: bigint) => 2n ** 64n - x; // −x, as 64 unsigned bits
const signed = (x: bigint) => (x >= 2n ** 63n ? x - 2n ** 64n : x);

/** Each case: an instruction [opcode, A + 16·B, D], with r0 and r1; the answer lands in r2. */
const CASES: [number, bigint, bigint, string][] = [
  [190, 0x7fffffffn, 1n, "2^31 − 1 + 1, in 32 bits"],
  [203, 5n, 0n, "5 ÷ 0, unsigned"],
  [204, 2n ** 63n, neg(1n), "−2^63 ÷ −1: too big to fit"],
  [204, neg(7n), 2n, "−7 ÷ 2: towards zero"],
  [206, neg(7n), 2n, "−7 rem 2: the dividend's sign"],
  [209, neg(8n), 1n, "−8 >> 1, arithmetic"],
  [208, neg(8n), 1n, "−8 >> 1, logical"],
  [222, 1n, 1n, "1 rotated right by 1"],
  [214, neg(1n), neg(1n), "(2^64 − 1)², upper 64 bits"],
];

const run = new Run("alu");
for (const [opcode, r0, r1, what] of CASES) {
  const program = assemble([[opcode, 0x10, 2]]);
  const machine = newMachine(program, [r0, r1]);
  step(machine);
  const r2 = machine.registers[2];
  const { name } = decodeInstruction(program, 0);
  const answer = `0x${r2.toString(16).padStart(16, "0")} = ${signed(r2)}`;
  console.log(`${name.padEnd(14)} ${what.padEnd(32)} ${answer}`);
  run.event("case", { name, what, answer });
}
const link = await run.report();
if (link) console.log(`reported to Grafana: ${link}`);
```

What flows through it, for the −7 ÷ 2 case:

::: code-group

```text [what goes in]
nine one-instruction programs, written in bin/alu.ts itself; this one:
  [204, 0x10, 2]   div_s_64 r2 = r0 ÷ r1
  r0 = 2^64 − 7 (−7, as unsigned bits)   r1 = 2
```

```ts [what it computes]
// the −7 ÷ 2 case, after its one step
const computed = {
  name: "div_s_64", // opcode 204, decoded back for the printout
  r2: 0xfffffffffffffffdn, // the raw 64 bits the division left
  signed: -3n, // the same bits read signed: towards zero, not −4
};
```

```text [what comes out]
div_s_64       −7 ÷ 2: towards zero             0xfffffffffffffffd = -3
```

:::

The program prints r2 twice, as raw bits and as a signed number: same bits, two readings.

**Run**

```sh
npm pkg set scripts.alu="node bin/alu.ts"
npm run alu
```

```text
add_32         2^31 − 1 + 1, in 32 bits         0xffffffff80000000 = -2147483648
div_u_64       5 ÷ 0, unsigned                  0xffffffffffffffff = -1
div_s_64       −2^63 ÷ −1: too big to fit       0x8000000000000000 = -9223372036854775808
div_s_64       −7 ÷ 2: towards zero             0xfffffffffffffffd = -3
rem_s_64       −7 rem 2: the dividend's sign    0xffffffffffffffff = -1
shar_r_64      −8 >> 1, arithmetic              0xfffffffffffffffc = -4
shlo_r_64      −8 >> 1, logical                 0x7ffffffffffffffc = 9223372036854775804
rot_r_64       1 rotated right by 1             0x8000000000000000 = -9223372036854775808
mul_upper_u_u  (2^64 − 1)², upper 64 bits       0xfffffffffffffffe = -2
reported to Grafana: http://127.0.0.1:3300/d/the-gray-tutor?var-client=you&var-run_id=alu-1791736638573
```

Every corner from the list, worked by your PVM and shown twice, as raw bits and signed.
Compare the two `−8 >> 1` lines: the same bits in, `-4` out of the arithmetic shift, a
huge positive number out of the logical one. The *ALU* panel has the table.

![ALU panel](./images/05-alu.png)

<details>
<summary>lasair: signed division, in <code>lib/pvm.ml</code></summary>

```ocaml
         | Div_s_64 { rd; ra; rb } ->
           let a = rget r ra and b = rget r rb in
           rset r rd (if b = 0L then (-1L)
                      else if a = Int64.min_int && b = (-1L) then a
                      else Int64.div a b);
```

The same three cases as your `div_s_64`. OCaml's `Int64` is signed and wraps on its own,
so lasair spells out the unsigned operations with `Int64.unsigned_div` and friends;
`bigint` never wraps, so your code says where, with `mod`. Each language makes one half
of the job free.

</details>

## Check your understanding

::: check
**A 32-bit instruction writes a 64-bit register. What goes into the upper 32 bits?**

- [ ] Zeros
  > No: that would be zero extension. `add_32` of 2^31 − 1 and 1 would then leave 2^31,
  > and it leaves −2^31.
- [x] Copies of the result's top bit: the 32-bit result is sign-extended
  > Yes: `add_32` of 2^31 − 1 and 1 has the low 32 bits `80000000`, negative as a signed
  > 32-bit number, so the 32 bits above become `ffffffff`.
- [ ] Whatever the register held before
  > No: the result is extended to all 64 bits, so nothing of the old value is left.

**`add_64` of 2^64 − 1 and 2?**

- [ ] 2^64 + 1
  > No: a register holds 64 bits, and 2^64 + 1 needs 65.
- [ ] A panic: the sum overflowed
  > No: overflow is never an error on the PVM. Everything is modulo 2^64.
- [x] 1
  > Yes: 2^64 + 1, modulo 2^64, is 1. The count rolls over like a car's odometer.

**A program divides by zero. What does the PVM do, and why?**

- [ ] It panics: there is no right answer to give
  > No: no arithmetic instruction panics. Division by zero has its answer in the table.
- [ ] It gives 0, and carries on
  > No: the Gray Paper picks all ones, 0xffffffffffffffff, not 0.
- [x] It gives 2^64 − 1, all ones, and carries on: a fixed answer, so every validator gets the same result
  > Yes: the Gray Paper gives division by zero an answer instead of a crash. The
  > remainder by 0 gives back the dividend.

**`div_s_64` of −7 and 2?**

- [ ] −4
  > No: that rounds down. Signed division rounds towards zero.
- [x] −3, and the remainder, `rem_s_64`, is −1
  > Yes: −3.5 towards zero is −3, and the remainder keeps the dividend's sign:
  > −7 = 2 × (−3) + (−1).
- [ ] A huge positive number, since −7 is 2^64 − 7 in the register
  > No: that's how `div_u_64` reads it. The `_s` reads both inputs as signed first.
:::

## What you have

All 72 arithmetic and logic instructions, every corner of the Gray Paper's tables tested.
[Lesson 15.6](./06-branches-and-calls.md) adds the rest of the branches, and calls.

Next: [15.6 Branches and calls](./06-branches-and-calls.md)
